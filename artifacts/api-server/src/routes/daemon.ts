import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync, readdirSync, statSync } from "fs";
import { join, basename, extname } from "path";
import multer from "multer";

const router = Router();

// ---------------------------------------------------------------------------
// In-memory stores (survive server restarts via JSON files on disk)
// ---------------------------------------------------------------------------

const DATA_DIR = join(process.cwd(), ".od-data");
const PROJECTS_FILE = join(DATA_DIR, "projects.json");
const CONVERSATIONS_FILE = join(DATA_DIR, "conversations.json");
const MESSAGES_FILE = join(DATA_DIR, "messages.json");
const TABS_FILE = join(DATA_DIR, "tabs.json");
const TEMPLATES_FILE = join(DATA_DIR, "templates.json");
const FILES_DIR = join(DATA_DIR, "files");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILES_DIR)) mkdirSync(FILES_DIR, { recursive: true });
}

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(path: string, data: unknown) {
  ensureDataDir();
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Types (mirrors @open-design/contracts shapes)
// ---------------------------------------------------------------------------

interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  status?: { value: string; updatedAt?: number; runId?: string };
  metadata?: Record<string, unknown>;
}

interface Conversation {
  id: string;
  projectId: string;
  title?: string | null;
  createdAt: number;
  updatedAt: number;
}

interface Message {
  id: string;
  projectId: string;
  conversationId: string;
  role: string;
  content: unknown;
  createdAt?: number;
  [key: string]: unknown;
}

interface TabsState {
  tabs: unknown[];
  active: string | null;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  sourceProjectId: string;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Multer setup for file uploads
// ---------------------------------------------------------------------------

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ---------------------------------------------------------------------------
// Helper: project files directory
// ---------------------------------------------------------------------------

function projectFilesDir(projectId: string): string {
  const dir = join(FILES_DIR, projectId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function mimeForExt(name: string): string {
  const ext = extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".ts": "application/typescript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".csv": "text/csv",
  };
  return map[ext] ?? "application/octet-stream";
}

// ---------------------------------------------------------------------------
// GET /api/health  (frontend calls this to detect daemon mode)
// ---------------------------------------------------------------------------

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// GET /api/version
// ---------------------------------------------------------------------------

router.get("/version", (_req: Request, res: Response) => {
  res.json({
    version: {
      version: "1.0.0-replit",
      channel: "stable",
      packaged: false,
      platform: process.platform,
      arch: process.arch,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/agents
// ---------------------------------------------------------------------------

router.get("/agents", (_req: Request, res: Response) => {
  res.json({ agents: [] });
});

// ---------------------------------------------------------------------------
// GET /api/skills   GET /api/skills/:id   GET /api/skills/:id/example
// ---------------------------------------------------------------------------

router.get("/skills", (_req: Request, res: Response) => {
  res.json({ skills: [] });
});

router.get("/skills/:id/example", (req: Request, res: Response) => {
  res.status(404).send("");
});

router.get("/skills/:id", (req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

// ---------------------------------------------------------------------------
// GET /api/design-systems  GET /api/design-systems/:id  /preview  /showcase
// ---------------------------------------------------------------------------

router.get("/design-systems", (_req: Request, res: Response) => {
  res.json({ designSystems: [] });
});

router.get("/design-systems/:id/preview", (req: Request, res: Response) => {
  res.status(404).send("");
});

router.get("/design-systems/:id/showcase", (req: Request, res: Response) => {
  res.status(404).send("");
});

router.get("/design-systems/:id", (req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

// ---------------------------------------------------------------------------
// GET /api/prompt-templates  GET /api/prompt-templates/:surface/:id
// ---------------------------------------------------------------------------

router.get("/prompt-templates", (_req: Request, res: Response) => {
  res.json({ promptTemplates: [] });
});

router.get("/prompt-templates/:surface/:id", (req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

// ---------------------------------------------------------------------------
// GET/PUT /api/deploy/config
// ---------------------------------------------------------------------------

let deployConfig = {
  providerId: "vercel-self",
  configured: false,
  tokenMask: "",
  teamId: "",
  teamSlug: "",
  target: "preview",
};

router.get("/deploy/config", (_req: Request, res: Response) => {
  res.json(deployConfig);
});

router.put("/deploy/config", (req: Request, res: Response) => {
  deployConfig = { ...deployConfig, ...req.body };
  res.json(deployConfig);
});

// ---------------------------------------------------------------------------
// PROJECTS
// ---------------------------------------------------------------------------

router.get("/projects", (_req: Request, res: Response) => {
  const projects = readJson<Project[]>(PROJECTS_FILE, []);
  res.json({ projects });
});

router.post("/projects", (req: Request, res: Response) => {
  const projects = readJson<Project[]>(PROJECTS_FILE, []);
  const now = Date.now();
  const project: Project = {
    id: req.body.id ?? randomUUID(),
    name: req.body.name ?? "Untitled",
    createdAt: now,
    updatedAt: now,
    status: { value: "not_started" },
    metadata: req.body.metadata ?? { kind: "prototype" },
  };
  projects.push(project);
  writeJson(PROJECTS_FILE, projects);

  // Auto-create a default conversation
  const conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
  const conversationId = randomUUID();
  conversations.push({
    id: conversationId,
    projectId: project.id,
    title: null,
    createdAt: now,
    updatedAt: now,
  });
  writeJson(CONVERSATIONS_FILE, conversations);

  res.status(201).json({ project, conversationId });
});

router.get("/projects/:id", (req: Request, res: Response) => {
  const projects = readJson<Project[]>(PROJECTS_FILE, []);
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "not found" });
  res.json({ project });
});

router.patch("/projects/:id", (req: Request, res: Response) => {
  const projects = readJson<Project[]>(PROJECTS_FILE, []);
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  projects[idx] = { ...projects[idx], ...req.body, id: req.params.id, updatedAt: Date.now() };
  writeJson(PROJECTS_FILE, projects);
  res.json({ project: projects[idx] });
});

router.delete("/projects/:id", (req: Request, res: Response) => {
  let projects = readJson<Project[]>(PROJECTS_FILE, []);
  projects = projects.filter((p) => p.id !== req.params.id);
  writeJson(PROJECTS_FILE, projects);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// DEPLOYMENTS (stub — no real deploy in Replit mode)
// ---------------------------------------------------------------------------

router.get("/projects/:id/deployments", (_req: Request, res: Response) => {
  res.json({ deployments: [] });
});

router.post("/projects/:id/deploy", (_req: Request, res: Response) => {
  res.status(503).json({ error: { message: "Deploy not supported in Replit daemon mode" } });
});

router.post("/projects/:projectId/deployments/:deploymentId/check-link", (_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

// ---------------------------------------------------------------------------
// CONVERSATIONS
// ---------------------------------------------------------------------------

router.get("/projects/:projectId/conversations", (req: Request, res: Response) => {
  const conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
  res.json({ conversations: conversations.filter((c) => c.projectId === req.params.projectId) });
});

router.post("/projects/:projectId/conversations", (req: Request, res: Response) => {
  const conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
  const now = Date.now();
  const conversation: Conversation = {
    id: randomUUID(),
    projectId: req.params.projectId,
    title: req.body?.title ?? null,
    createdAt: now,
    updatedAt: now,
  };
  conversations.push(conversation);
  writeJson(CONVERSATIONS_FILE, conversations);
  res.status(201).json({ conversation });
});

router.patch("/projects/:projectId/conversations/:conversationId", (req: Request, res: Response) => {
  const conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
  const idx = conversations.findIndex(
    (c) => c.projectId === req.params.projectId && c.id === req.params.conversationId,
  );
  if (idx === -1) return res.status(404).json({ error: "not found" });
  conversations[idx] = { ...conversations[idx], ...req.body, id: req.params.conversationId, projectId: req.params.projectId, updatedAt: Date.now() };
  writeJson(CONVERSATIONS_FILE, conversations);
  res.json({ conversation: conversations[idx] });
});

router.delete("/projects/:projectId/conversations/:conversationId", (req: Request, res: Response) => {
  let conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
  conversations = conversations.filter(
    (c) => !(c.projectId === req.params.projectId && c.id === req.params.conversationId),
  );
  writeJson(CONVERSATIONS_FILE, conversations);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// MESSAGES
// ---------------------------------------------------------------------------

router.get("/projects/:projectId/conversations/:conversationId/messages", (req: Request, res: Response) => {
  const messages = readJson<Message[]>(MESSAGES_FILE, []);
  res.json({
    messages: messages.filter(
      (m) => m.projectId === req.params.projectId && m.conversationId === req.params.conversationId,
    ),
  });
});

router.put("/projects/:projectId/conversations/:conversationId/messages/:messageId", (req: Request, res: Response) => {
  const messages = readJson<Message[]>(MESSAGES_FILE, []);
  const idx = messages.findIndex((m) => m.id === req.params.messageId);
  const msg: Message = {
    ...req.body,
    id: req.params.messageId,
    projectId: req.params.projectId,
    conversationId: req.params.conversationId,
  };
  if (idx === -1) {
    messages.push(msg);
  } else {
    messages[idx] = msg;
  }
  writeJson(MESSAGES_FILE, messages);
  res.json({ message: msg });
});

// ---------------------------------------------------------------------------
// TABS
// ---------------------------------------------------------------------------

router.get("/projects/:projectId/tabs", (req: Request, res: Response) => {
  const all = readJson<Record<string, TabsState>>(TABS_FILE, {});
  res.json(all[req.params.projectId] ?? { tabs: [], active: null });
});

router.put("/projects/:projectId/tabs", (req: Request, res: Response) => {
  const all = readJson<Record<string, TabsState>>(TABS_FILE, {});
  all[req.params.projectId] = req.body;
  writeJson(TABS_FILE, all);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// PROJECT FILES
// ---------------------------------------------------------------------------

router.get("/projects/:projectId/files", (req: Request, res: Response) => {
  const dir = projectFilesDir(req.params.projectId);
  try {
    const entries = readdirSync(dir);
    const files = entries.map((name) => {
      const st = statSync(join(dir, name));
      return { name, path: name, size: st.size, updatedAt: st.mtimeMs };
    });
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

router.post("/projects/:projectId/files", upload.single("file"), (req: Request, res: Response) => {
  const dir = projectFilesDir(req.params.projectId);
  // Handles both JSON body (text/base64) and multipart (file upload)
  if (req.file) {
    const name = (req.body?.name as string | undefined) ?? req.file.originalname;
    const safeName = basename(name);
    writeFileSync(join(dir, safeName), req.file.buffer);
    const st = statSync(join(dir, safeName));
    return res.status(201).json({ file: { name: safeName, path: safeName, size: st.size, updatedAt: st.mtimeMs } });
  }

  // JSON body: { name, content, encoding? }
  const { name, content, encoding } = req.body as { name?: string; content?: string; encoding?: string };
  if (!name || content === undefined) return res.status(400).json({ error: "name and content required" });
  const safeName = basename(name);
  const buf = encoding === "base64" ? Buffer.from(content, "base64") : Buffer.from(content, "utf-8");
  writeFileSync(join(dir, safeName), buf);
  const st = statSync(join(dir, safeName));
  res.status(201).json({ file: { name: safeName, path: safeName, size: st.size, updatedAt: st.mtimeMs } });
});

// Multi-file upload
router.post("/projects/:projectId/upload", upload.array("files", 50), (req: Request, res: Response) => {
  const dir = projectFilesDir(req.params.projectId);
  const files: { name: string; path: string; size: number; originalName: string }[] = [];
  for (const f of (req.files as Express.Multer.File[]) ?? []) {
    const safeName = basename(f.originalname);
    writeFileSync(join(dir, safeName), f.buffer);
    const st = statSync(join(dir, safeName));
    files.push({ name: safeName, path: safeName, size: st.size, originalName: f.originalname });
  }
  res.json({ files });
});

// Serve a raw project file — Express 5 / path-to-regexp v8 wildcard syntax
router.get("/projects/:projectId/raw/{*filePath}", (req: Request, res: Response) => {
  const dir = projectFilesDir(req.params.projectId);
  const name = basename(decodeURIComponent((req.params as Record<string, string>).filePath ?? ""));
  const full = join(dir, name);
  if (!existsSync(full)) return res.status(404).send("not found");
  res.setHeader("Content-Type", mimeForExt(name));
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(full);
});

// Delete a raw project file
router.delete("/projects/:projectId/raw/{*filePath}", (req: Request, res: Response) => {
  const dir = projectFilesDir(req.params.projectId);
  const name = basename(decodeURIComponent((req.params as Record<string, string>).filePath ?? ""));
  const full = join(dir, name);
  try {
    if (existsSync(full)) unlinkSync(full);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "delete failed" });
  }
});

// File preview (stub — return 404 for non-supported types)
router.get("/projects/:projectId/files/:name/preview", (_req: Request, res: Response) => {
  res.status(404).json({ error: "preview not supported" });
});

// ---------------------------------------------------------------------------
// TEMPLATES
// ---------------------------------------------------------------------------

router.get("/templates", (_req: Request, res: Response) => {
  const templates = readJson<Template[]>(TEMPLATES_FILE, []);
  res.json({ templates });
});

router.post("/templates", (req: Request, res: Response) => {
  const templates = readJson<Template[]>(TEMPLATES_FILE, []);
  const template: Template = {
    id: randomUUID(),
    name: req.body.name ?? "Untitled template",
    description: req.body.description,
    sourceProjectId: req.body.sourceProjectId,
    createdAt: Date.now(),
  };
  templates.push(template);
  writeJson(TEMPLATES_FILE, templates);
  res.status(201).json({ template });
});

router.get("/templates/:id", (req: Request, res: Response) => {
  const templates = readJson<Template[]>(TEMPLATES_FILE, []);
  const template = templates.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: "not found" });
  res.json({ template });
});

router.delete("/templates/:id", (req: Request, res: Response) => {
  let templates = readJson<Template[]>(TEMPLATES_FILE, []);
  templates = templates.filter((t) => t.id !== req.params.id);
  writeJson(TEMPLATES_FILE, templates);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// IMPORT — claude-design zip (stub: 501 in Replit mode)
// ---------------------------------------------------------------------------

router.post("/import/claude-design", upload.single("file"), (_req: Request, res: Response) => {
  res.status(501).json({ error: "claude-design import not supported in Replit mode" });
});

// ---------------------------------------------------------------------------
// RUNS — chat agent runs (stub: 501 in Replit/API mode — runs go directly
// through the Anthropic SDK in the frontend)
// ---------------------------------------------------------------------------

router.get("/runs", (_req: Request, res: Response) => {
  res.json({ runs: [] });
});

router.post("/runs", (_req: Request, res: Response) => {
  res.status(501).json({ error: "daemon runs not supported in API mode" });
});

router.get("/runs/:id", (req: Request, res: Response) => {
  res.status(404).json({ error: "run not found" });
});

router.post("/runs/:id/cancel", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

router.get("/runs/:id/events", (_req: Request, res: Response) => {
  // SSE endpoint — immediately close with done
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.write("data: {\"type\":\"done\"}\n\n");
  res.end();
});

// ---------------------------------------------------------------------------
// ARTIFACTS save (stub: just acknowledge)
// ---------------------------------------------------------------------------

router.post("/artifacts/save", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// MEDIA config (stub)
// ---------------------------------------------------------------------------

router.get("/media/config", (_req: Request, res: Response) => {
  res.json({ providers: [] });
});

// ---------------------------------------------------------------------------
// PROXY (stub — frontend uses Anthropic SDK directly in API mode)
// ---------------------------------------------------------------------------

router.post("/proxy/anthropic/stream", (_req: Request, res: Response) => {
  res.status(501).json({ error: "proxy not available in Replit mode" });
});

router.post("/proxy/stream", (_req: Request, res: Response) => {
  res.status(501).json({ error: "proxy not available in Replit mode" });
});

export default router;
