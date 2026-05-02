import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  readdirSync,
  statSync,
} from "fs";
import { join, extname, relative, resolve, normalize } from "path";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";

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

interface RunRecord {
  id: string;
  projectId: string | null;
  conversationId: string | null;
  assistantMessageId: string | null;
  agentId: string | null;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  createdAt: number;
  updatedAt: number;
  exitCode?: number | null;
  signal?: string | null;
  // Buffered SSE events for polling clients
  events: Array<{ id: string; event: string; data: unknown }>;
}

// ---------------------------------------------------------------------------
// In-memory run store (runs are ephemeral — no disk persistence needed)
// ---------------------------------------------------------------------------

const runs = new Map<string, RunRecord>();
const runCancelTokens = new Map<string, AbortController>();

// ---------------------------------------------------------------------------
// Multer setup for file uploads
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ---------------------------------------------------------------------------
// Helper: project files directory
// Safe join that prevents path traversal outside the project dir.
// ---------------------------------------------------------------------------

function projectFilesDir(projectId: string): string {
  const dir = join(FILES_DIR, projectId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Safely resolve a user-supplied relative file name/path within a project dir.
 * Strips leading slashes, prevents directory traversal, creates parent dirs.
 * Returns the absolute path to write/read, and the relative name used as the
 * canonical key (e.g. "components/Button.tsx").
 */
function safeProjectFilePath(
  projectId: string,
  rawName: string,
): { full: string; relName: string } {
  const dir = projectFilesDir(projectId);
  // Normalize and strip leading slashes to turn /foo/bar into foo/bar
  const normalized = normalize(rawName).replace(/^[/\\]+/, "");
  const full = resolve(dir, normalized);
  // Guard against traversal outside the project dir
  if (!full.startsWith(dir + "/") && full !== dir) {
    throw new Error(`Path traversal attempt: ${rawName}`);
  }
  const relName = relative(dir, full);
  // Ensure parent directory exists
  const parent = join(full, "..");
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  return { full, relName };
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
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Recursively list all files in a directory, returning relative paths. */
function listFilesRecursive(dir: string, base = ""): Array<{ name: string; size: number; updatedAt: number }> {
  const out: Array<{ name: string; size: number; updatedAt: number }> = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(join(dir, entry.name), relPath));
    } else {
      const st = statSync(join(dir, entry.name));
      out.push({ name: relPath, size: st.size, updatedAt: st.mtimeMs });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// SSE helper
// ---------------------------------------------------------------------------

function sseWrite(res: Response, event: string, data: unknown, id?: string) {
  if (id) res.write(`id: ${id}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
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
// GET /api/agents  — expose a virtual "replit-api" agent so the app can
// select it and route messages through our Anthropic proxy (/api/runs).
// ---------------------------------------------------------------------------

router.get("/agents", (_req: Request, res: Response) => {
  res.json({
    agents: [
      {
        id: "replit-api",
        name: "Anthropic API (Replit)",
        bin: "replit-api",
        available: true,
        path: null,
        version: "1.0.0",
        models: [
          { id: "claude-opus-4-5", label: "Claude Opus 4.5" },
          { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
          { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
          { id: "claude-opus-4-5-20251101", label: "Claude Opus 4.5 (Nov)" },
          { id: "claude-sonnet-4-5-20251001", label: "Claude Sonnet 4.5 (Oct)" },
          { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
          { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
          { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
        ],
        reasoningOptions: [],
      },
    ],
  });
});

// ---------------------------------------------------------------------------
// GET /api/skills   GET /api/skills/:id   GET /api/skills/:id/example
// ---------------------------------------------------------------------------

router.get("/skills", (_req: Request, res: Response) => {
  res.json({ skills: [] });
});

router.get("/skills/:id/example", (_req: Request, res: Response) => {
  res.status(404).send("");
});

router.get("/skills/:id", (_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

// ---------------------------------------------------------------------------
// GET /api/design-systems  GET /api/design-systems/:id  /preview  /showcase
// ---------------------------------------------------------------------------

router.get("/design-systems", (_req: Request, res: Response) => {
  res.json({ designSystems: [] });
});

router.get(
  "/design-systems/:id/preview",
  (_req: Request, res: Response) => {
    res.status(404).send("");
  },
);

router.get(
  "/design-systems/:id/showcase",
  (_req: Request, res: Response) => {
    res.status(404).send("");
  },
);

router.get("/design-systems/:id", (_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

// ---------------------------------------------------------------------------
// GET /api/prompt-templates  GET /api/prompt-templates/:surface/:id
// ---------------------------------------------------------------------------

router.get("/prompt-templates", (_req: Request, res: Response) => {
  res.json({ promptTemplates: [] });
});

router.get(
  "/prompt-templates/:surface/:id",
  (_req: Request, res: Response) => {
    res.status(404).json({ error: "not found" });
  },
);

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
  deployConfig = { ...deployConfig, ...(req.body as typeof deployConfig) };
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
  const body = req.body as {
    id?: string;
    name?: string;
    metadata?: Record<string, unknown>;
  };
  const project: Project = {
    id: body.id ?? randomUUID(),
    name: body.name ?? "Untitled",
    createdAt: now,
    updatedAt: now,
    status: { value: "not_started" },
    metadata: body.metadata ?? { kind: "prototype" },
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
  projects[idx] = {
    ...projects[idx],
    ...(req.body as Partial<Project>),
    id: req.params.id,
    updatedAt: Date.now(),
  };
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
  res
    .status(503)
    .json({ error: { message: "Deploy not supported in Replit daemon mode" } });
});

router.post(
  "/projects/:projectId/deployments/:deploymentId/check-link",
  (_req: Request, res: Response) => {
    res.status(404).json({ error: "not found" });
  },
);

// ---------------------------------------------------------------------------
// CONVERSATIONS
// ---------------------------------------------------------------------------

router.get(
  "/projects/:projectId/conversations",
  (req: Request, res: Response) => {
    const conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
    res.json({
      conversations: conversations.filter(
        (c) => c.projectId === req.params.projectId,
      ),
    });
  },
);

router.post(
  "/projects/:projectId/conversations",
  (req: Request, res: Response) => {
    const conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
    const now = Date.now();
    const conversation: Conversation = {
      id: randomUUID(),
      projectId: req.params.projectId,
      title: (req.body as { title?: string })?.title ?? null,
      createdAt: now,
      updatedAt: now,
    };
    conversations.push(conversation);
    writeJson(CONVERSATIONS_FILE, conversations);
    res.status(201).json({ conversation });
  },
);

router.patch(
  "/projects/:projectId/conversations/:conversationId",
  (req: Request, res: Response) => {
    const conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
    const idx = conversations.findIndex(
      (c) =>
        c.projectId === req.params.projectId &&
        c.id === req.params.conversationId,
    );
    if (idx === -1) return res.status(404).json({ error: "not found" });
    conversations[idx] = {
      ...conversations[idx],
      ...(req.body as Partial<Conversation>),
      id: req.params.conversationId,
      projectId: req.params.projectId,
      updatedAt: Date.now(),
    };
    writeJson(CONVERSATIONS_FILE, conversations);
    res.json({ conversation: conversations[idx] });
  },
);

router.delete(
  "/projects/:projectId/conversations/:conversationId",
  (req: Request, res: Response) => {
    let conversations = readJson<Conversation[]>(CONVERSATIONS_FILE, []);
    conversations = conversations.filter(
      (c) =>
        !(
          c.projectId === req.params.projectId &&
          c.id === req.params.conversationId
        ),
    );
    writeJson(CONVERSATIONS_FILE, conversations);
    res.json({ ok: true });
  },
);

// ---------------------------------------------------------------------------
// MESSAGES
// ---------------------------------------------------------------------------

router.get(
  "/projects/:projectId/conversations/:conversationId/messages",
  (req: Request, res: Response) => {
    const messages = readJson<Message[]>(MESSAGES_FILE, []);
    res.json({
      messages: messages.filter(
        (m) =>
          m.projectId === req.params.projectId &&
          m.conversationId === req.params.conversationId,
      ),
    });
  },
);

router.put(
  "/projects/:projectId/conversations/:conversationId/messages/:messageId",
  (req: Request, res: Response) => {
    const messages = readJson<Message[]>(MESSAGES_FILE, []);
    const idx = messages.findIndex((m) => m.id === req.params.messageId);
    const msg: Message = {
      ...(req.body as Message),
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
  },
);

// ---------------------------------------------------------------------------
// TABS
// ---------------------------------------------------------------------------

router.get("/projects/:projectId/tabs", (req: Request, res: Response) => {
  const all = readJson<Record<string, TabsState>>(TABS_FILE, {});
  res.json(all[req.params.projectId] ?? { tabs: [], active: null });
});

router.put("/projects/:projectId/tabs", (req: Request, res: Response) => {
  const all = readJson<Record<string, TabsState>>(TABS_FILE, {});
  all[req.params.projectId] = req.body as TabsState;
  writeJson(TABS_FILE, all);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// PROJECT FILES
// ---------------------------------------------------------------------------

router.get("/projects/:projectId/files", (req: Request, res: Response) => {
  const dir = projectFilesDir(req.params.projectId);
  try {
    const files = listFilesRecursive(dir);
    res.json({ files: files.map((f) => ({ ...f, path: f.name })) });
  } catch {
    res.json({ files: [] });
  }
});

router.post(
  "/projects/:projectId/files",
  upload.single("file"),
  (req: Request, res: Response) => {
    const dir = projectFilesDir(req.params.projectId);

    // Multipart file upload
    if (req.file) {
      const rawName =
        ((req.body as { name?: string }).name) ?? req.file.originalname;
      try {
        const { full, relName } = safeProjectFilePath(req.params.projectId, rawName);
        writeFileSync(full, req.file.buffer);
        const st = statSync(full);
        return res.status(201).json({
          file: { name: relName, path: relName, size: st.size, updatedAt: st.mtimeMs },
        });
      } catch (e) {
        return res.status(400).json({ error: String(e) });
      }
    }

    // JSON body: { name, content, encoding? }
    const body = req.body as { name?: string; content?: string; encoding?: string };
    const { name, content, encoding } = body;
    if (!name || content === undefined) {
      return res.status(400).json({ error: "name and content required" });
    }
    try {
      const { full, relName } = safeProjectFilePath(req.params.projectId, name);
      const buf =
        encoding === "base64"
          ? Buffer.from(content, "base64")
          : Buffer.from(content, "utf-8");
      writeFileSync(full, buf);
      const st = statSync(full);
      res.status(201).json({
        file: { name: relName, path: relName, size: st.size, updatedAt: st.mtimeMs },
      });
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  },
);

// Multi-file upload
router.post(
  "/projects/:projectId/upload",
  upload.array("files", 50),
  (req: Request, res: Response) => {
    const files: {
      name: string;
      path: string;
      size: number;
      originalName: string;
    }[] = [];
    for (const f of (req.files as Express.Multer.File[]) ?? []) {
      try {
        const { full, relName } = safeProjectFilePath(
          req.params.projectId,
          f.originalname,
        );
        writeFileSync(full, f.buffer);
        const st = statSync(full);
        files.push({
          name: relName,
          path: relName,
          size: st.size,
          originalName: f.originalname,
        });
      } catch {
        // skip unsafe paths
      }
    }
    res.json({ files });
  },
);

// Serve a raw project file — Express 5 / path-to-regexp v8 wildcard syntax
router.get(
  "/projects/:projectId/raw/{*filePath}",
  (req: Request, res: Response) => {
    const filePath = decodeURIComponent(
      (req.params as Record<string, string>).filePath ?? "",
    );
    try {
      const { full } = safeProjectFilePath(req.params.projectId, filePath);
      if (!existsSync(full)) return res.status(404).send("not found");
      res.setHeader("Content-Type", mimeForExt(filePath));
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(full);
    } catch {
      res.status(400).send("invalid path");
    }
  },
);

// Delete a raw project file
router.delete(
  "/projects/:projectId/raw/{*filePath}",
  (req: Request, res: Response) => {
    const filePath = decodeURIComponent(
      (req.params as Record<string, string>).filePath ?? "",
    );
    try {
      const { full } = safeProjectFilePath(req.params.projectId, filePath);
      if (existsSync(full)) unlinkSync(full);
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: "invalid path" });
    }
  },
);

// File preview (stub — return 404 for non-supported types)
router.get(
  "/projects/:projectId/files/:name/preview",
  (_req: Request, res: Response) => {
    res.status(404).json({ error: "preview not supported" });
  },
);

// ---------------------------------------------------------------------------
// TEMPLATES
// ---------------------------------------------------------------------------

router.get("/templates", (_req: Request, res: Response) => {
  const templates = readJson<Template[]>(TEMPLATES_FILE, []);
  res.json({ templates });
});

router.post("/templates", (req: Request, res: Response) => {
  const templates = readJson<Template[]>(TEMPLATES_FILE, []);
  const body = req.body as {
    name?: string;
    description?: string;
    sourceProjectId: string;
  };
  const template: Template = {
    id: randomUUID(),
    name: body.name ?? "Untitled template",
    description: body.description,
    sourceProjectId: body.sourceProjectId,
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

router.post(
  "/import/claude-design",
  upload.single("file"),
  (_req: Request, res: Response) => {
    res.status(501).json({
      error: "claude-design import not supported in Replit mode",
    });
  },
);

// ---------------------------------------------------------------------------
// RUNS — Anthropic proxy that emits the same SSE protocol as the local daemon
// ---------------------------------------------------------------------------

interface RunRequest {
  agentId: string;
  message: string;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  model?: string | null;
  projectId?: string | null;
  conversationId?: string | null;
  assistantMessageId?: string | null;
}

router.get("/runs", (_req: Request, res: Response) => {
  res.json({ runs: [] });
});

router.post("/runs", async (req: Request, res: Response) => {
  const body = req.body as RunRequest;

  if (!body.apiKey) {
    return res.status(400).json({
      error: {
        message:
          "No API key provided. Set your Anthropic API key in Settings → Configure execution mode.",
      },
    });
  }

  const runId = randomUUID();
  const now = Date.now();
  const run: RunRecord = {
    id: runId,
    projectId: body.projectId ?? null,
    conversationId: body.conversationId ?? null,
    assistantMessageId: body.assistantMessageId ?? null,
    agentId: body.agentId,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    events: [],
  };
  runs.set(runId, run);

  const controller = new AbortController();
  runCancelTokens.set(runId, controller);

  // Kick off the Anthropic streaming in the background
  void streamAnthropicRun(run, body, controller.signal).catch((err) => {
    const r = runs.get(runId);
    if (r && r.status === "running") {
      r.status = "failed";
      r.updatedAt = Date.now();
      r.events.push({
        id: randomUUID(),
        event: "error",
        data: {
          error: { message: String((err as Error).message ?? err) },
        },
      });
      r.events.push({
        id: randomUUID(),
        event: "end",
        data: { code: 1, status: "failed" },
      });
    }
  });

  res.status(201).json({ runId });
});

router.get("/runs/:id", (req: Request, res: Response) => {
  const run = runs.get(req.params.id);
  if (!run) return res.status(404).json({ error: "run not found" });
  res.json({
    id: run.id,
    projectId: run.projectId,
    conversationId: run.conversationId,
    assistantMessageId: run.assistantMessageId,
    agentId: run.agentId,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    exitCode: run.exitCode ?? null,
    signal: run.signal ?? null,
  });
});

router.post("/runs/:id/cancel", (req: Request, res: Response) => {
  const run = runs.get(req.params.id);
  if (run && (run.status === "queued" || run.status === "running")) {
    run.status = "canceled";
    run.updatedAt = Date.now();
    const ctrl = runCancelTokens.get(req.params.id);
    if (ctrl) ctrl.abort();
  }
  res.json({ ok: true });
});

/**
 * SSE stream of events for a run.
 * Replays buffered events then streams new ones live until the run ends.
 */
router.get("/runs/:id/events", (req: Request, res: Response) => {
  const run = runs.get(req.params.id);
  if (!run) {
    // Return empty SSE that immediately signals done
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    sseWrite(res, "error", { error: { message: "run not found" } });
    sseWrite(res, "end", { code: 1, status: "failed" });
    res.end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const afterId = (req.query.after as string | undefined) ?? null;

  // Find index of the event after `afterId`
  let startIdx = 0;
  if (afterId) {
    const idx = run.events.findIndex((e) => e.id === afterId);
    startIdx = idx === -1 ? 0 : idx + 1;
  }

  // Replay buffered events
  for (let i = startIdx; i < run.events.length; i++) {
    const e = run.events[i];
    sseWrite(res, e.event, e.data, e.id);
  }

  // If already done, close
  const terminal = ["succeeded", "failed", "canceled"];
  if (terminal.includes(run.status)) {
    res.end();
    return;
  }

  // Poll for new events
  let cursor = run.events.length;
  const interval = setInterval(() => {
    const r = runs.get(req.params.id);
    if (!r) {
      clearInterval(interval);
      res.end();
      return;
    }
    while (cursor < r.events.length) {
      const e = r.events[cursor];
      sseWrite(res, e.event, e.data, e.id);
      cursor++;
    }
    if (terminal.includes(r.status)) {
      clearInterval(interval);
      res.end();
    }
  }, 50);

  req.on("close", () => {
    clearInterval(interval);
  });
});

// ---------------------------------------------------------------------------
// Core Anthropic streaming logic — emits daemon-compatible SSE events into
// the run's event buffer so any connected SSE client picks them up.
// ---------------------------------------------------------------------------

async function streamAnthropicRun(
  run: RunRecord,
  body: RunRequest,
  signal: AbortSignal,
): Promise<void> {
  run.status = "running";
  run.updatedAt = Date.now();

  const pushEvent = (event: string, data: unknown) => {
    run.events.push({ id: randomUUID(), event, data });
    run.updatedAt = Date.now();
  };

  // Emit "start" event
  pushEvent("start", {
    runId: run.id,
    agentId: run.agentId,
    bin: "replit-api",
    protocolVersion: 1,
    projectId: run.projectId,
  });

  pushEvent("agent", { type: "status", label: "requesting", model: body.model ?? "claude-sonnet-4-5" });

  // Build the message list — last item is the user message
  const userMessage = body.message ?? "";
  const model = body.model ?? "claude-sonnet-4-5";
  const maxTokens = body.maxTokens ?? 8192;

  const client = new Anthropic({
    apiKey: body.apiKey,
    baseURL: body.baseUrl?.includes("anthropic.com")
      ? undefined
      : body.baseUrl,
  });

  try {
    const stream = client.messages.stream(
      {
        model,
        max_tokens: maxTokens,
        system: body.systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal },
    );

    let inputTokens = 0;
    let outputTokens = 0;
    const startMs = Date.now();

    for await (const event of stream) {
      if (signal.aborted) break;

      if (event.type === "message_start") {
        inputTokens = event.message.usage?.input_tokens ?? 0;
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          const text = event.delta.text;
          pushEvent("agent", { type: "text_delta", delta: text });
        }
      } else if (event.type === "message_delta") {
        outputTokens = event.usage?.output_tokens ?? 0;
      } else if (event.type === "message_stop") {
        // done
      }
    }

    if (signal.aborted) {
      run.status = "canceled";
      pushEvent("end", { code: null, signal: "SIGTERM", status: "canceled" });
      return;
    }

    // Emit usage
    pushEvent("agent", {
      type: "usage",
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
      durationMs: Date.now() - startMs,
    });

    run.status = "succeeded";
    run.exitCode = 0;
    pushEvent("end", { code: 0, status: "succeeded" });
  } catch (err) {
    if (signal.aborted) {
      run.status = "canceled";
      pushEvent("end", { code: null, signal: "SIGTERM", status: "canceled" });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    run.status = "failed";
    run.exitCode = 1;
    pushEvent("error", { error: { message: msg } });
    pushEvent("end", { code: 1, status: "failed" });
  } finally {
    runCancelTokens.delete(run.id);
  }
}

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
// PROXY (legacy — the Replit daemon uses /api/runs instead)
// ---------------------------------------------------------------------------

router.post("/proxy/anthropic/stream", (_req: Request, res: Response) => {
  res
    .status(410)
    .json({ error: "use /api/runs instead" });
});

router.post("/proxy/stream", (_req: Request, res: Response) => {
  res
    .status(410)
    .json({ error: "use /api/runs instead" });
});

export default router;
