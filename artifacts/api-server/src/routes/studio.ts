import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireInternal } from "../lib/internal-auth";

const router: IRouter = Router();

// Every studio route requires the internal header. TODO real auth.
router.use("/studio", requireInternal);

const ALLOWED_STATUS = new Set(["new", "active", "completed"]);
const ALLOWED_SOURCE = new Set(["manual", "promoted", "public"]);

const cap = (v: unknown, n: number): string =>
  typeof v === "string" ? v.trim().slice(0, n) : "";

// Title-generation rules live server-side so every caller (manual
// form, future public-form hook, promote-from-lead button) gets
// identical behaviour without duplicating string logic in the
// frontend. `withEllipsis` is opt-in: the public auto-title appends
// "…" on truncation, but the promoted title is exactly
// "Promoted from <first 40 chars>" with no ellipsis suffix.
function titleFromVision(
  vision: string,
  max: number,
  opts: { prefix?: string; withEllipsis?: boolean } = {},
): string {
  const { prefix = "", withEllipsis = false } = opts;
  const slice = vision.slice(0, max);
  const truncated = vision.length > max;
  const body =
    withEllipsis && truncated ? `${slice.trimEnd()}…` : slice.trimEnd();
  return prefix ? `${prefix}${body}` : body;
}

type BriefRow = {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  vision: string;
  budget_note: string;
  status: string;
  notes: string;
  source_lead_id: string | null;
  created_at: string;
  updated_at: string;
};

// ---- Briefs --------------------------------------------------------

router.get("/studio/briefs", async (req, res) => {
  const status =
    typeof req.query.status === "string" ? req.query.status : null;

  // Strict whitelist: reject unknown values rather than silently
  // falling back to "everything", which would hide bugs in callers
  // and could leak rows the caller did not ask for.
  if (status !== null && !ALLOWED_STATUS.has(status)) {
    res.status(400).json({ error: "invalid status" });
    return;
  }

  try {
    let result;
    if (status) {
      result = await pool.query<BriefRow>(
        `SELECT id, title, client_name, client_email, vision, budget_note,
                status, notes, source_lead_id, created_at, updated_at
           FROM bonanza_briefs
          WHERE deleted_at IS NULL AND status = $1
          ORDER BY updated_at DESC`,
        [status],
      );
    } else {
      result = await pool.query<BriefRow>(
        `SELECT id, title, client_name, client_email, vision, budget_note,
                status, notes, source_lead_id, created_at, updated_at
           FROM bonanza_briefs
          WHERE deleted_at IS NULL
          ORDER BY updated_at DESC`,
      );
    }
    res.json({ briefs: result.rows });
  } catch (err) {
    logger.error({ err }, "briefs list failed");
    res.status(500).json({ error: "could not load briefs" });
  }
});

router.get("/studio/briefs/:id", async (req, res) => {
  try {
    const result = await pool.query<BriefRow>(
      `SELECT id, title, client_name, client_email, vision, budget_note,
              status, notes, source_lead_id, created_at, updated_at
         FROM bonanza_briefs
        WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id],
    );
    const brief = result.rows[0];
    if (!brief) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ brief });
  } catch (err) {
    logger.error({ err }, "brief get failed");
    res.status(500).json({ error: "could not load brief" });
  }
});

router.post("/studio/briefs", async (req, res) => {
  // `source` defaults to "manual" when omitted (the common case from
  // the in-app create form), but if the caller *does* send a value it
  // must be one of the known discriminators. Silently coercing
  // unknown sources hides client bugs.
  const sourceRaw = req.body?.source;
  let source: string;
  if (sourceRaw === undefined || sourceRaw === null) {
    source = "manual";
  } else if (typeof sourceRaw === "string" && ALLOWED_SOURCE.has(sourceRaw)) {
    source = sourceRaw;
  } else {
    res.status(400).json({ error: "invalid source" });
    return;
  }

  const sourceLeadId =
    typeof req.body?.source_lead_id === "string"
      ? req.body.source_lead_id
      : null;

  let title = cap(req.body?.title, 200);
  let clientName = cap(req.body?.client_name, 200);
  let clientEmail = cap(req.body?.client_email, 320);
  let vision = cap(req.body?.vision, 4000);
  const budgetNoteRaw = cap(req.body?.budget_note, 1000);
  const budgetNote = budgetNoteRaw || "Not specified";

  // Promote-from-lead: ignore client-supplied title/vision/email and
  // copy from the lead row server-side. Source of truth lives in the
  // database, not in whatever the frontend chose to forward.
  if (source === "promoted") {
    if (!sourceLeadId) {
      res.status(400).json({ error: "source_lead_id is required for promoted" });
      return;
    }
    try {
      const leadResult = await pool.query<{
        id: string;
        vision: string;
        email: string;
      }>(
        `SELECT id, vision, email FROM bonanza_leads WHERE id = $1`,
        [sourceLeadId],
      );
      const lead = leadResult.rows[0];
      if (!lead) {
        res.status(404).json({ error: "lead not found" });
        return;
      }
      vision = lead.vision;
      clientEmail = lead.email;
      title = titleFromVision(vision, 40, { prefix: "Promoted from " });
    } catch (err) {
      logger.error({ err }, "promote lookup failed");
      res.status(500).json({ error: "could not promote lead" });
      return;
    }
  } else if (source === "public") {
    if (!vision) {
      res.status(400).json({ error: "vision is required" });
      return;
    }
    title = titleFromVision(vision, 60, { withEllipsis: true });
  } else {
    // manual
    if (!vision) {
      res.status(400).json({ error: "vision is required" });
      return;
    }
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
  }

  try {
    const result = await pool.query<BriefRow>(
      `INSERT INTO bonanza_briefs
         (title, client_name, client_email, vision, budget_note,
          status, notes, source_lead_id)
       VALUES ($1, $2, $3, $4, $5, 'new', '', $6)
       RETURNING id, title, client_name, client_email, vision, budget_note,
                 status, notes, source_lead_id, created_at, updated_at`,
      [
        title,
        clientName,
        clientEmail,
        vision,
        budgetNote,
        source === "promoted" ? sourceLeadId : null,
      ],
    );
    res.status(201).json({ brief: result.rows[0] });
  } catch (err) {
    logger.error({ err }, "brief insert failed");
    res.status(500).json({ error: "could not create brief" });
  }
});

router.patch("/studio/briefs/:id", async (req, res) => {
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (typeof req.body?.title === "string") {
    const t = cap(req.body.title, 200);
    if (!t) {
      res.status(400).json({ error: "title cannot be empty" });
      return;
    }
    updates.push(`title = $${i++}`);
    values.push(t);
  }
  if (typeof req.body?.notes === "string") {
    updates.push(`notes = $${i++}`);
    values.push(cap(req.body.notes, 10_000));
  }
  if (typeof req.body?.status === "string") {
    if (!ALLOWED_STATUS.has(req.body.status)) {
      res.status(400).json({ error: "invalid status" });
      return;
    }
    updates.push(`status = $${i++}`);
    values.push(req.body.status);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "no updatable fields supplied" });
    return;
  }

  updates.push(`updated_at = now()`);
  values.push(req.params.id);

  try {
    const result = await pool.query<BriefRow>(
      `UPDATE bonanza_briefs SET ${updates.join(", ")}
        WHERE id = $${i} AND deleted_at IS NULL
        RETURNING id, title, client_name, client_email, vision, budget_note,
                  status, notes, source_lead_id, created_at, updated_at`,
      values,
    );
    const brief = result.rows[0];
    if (!brief) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ brief });
  } catch (err) {
    logger.error({ err }, "brief patch failed");
    res.status(500).json({ error: "could not update brief" });
  }
});

router.delete("/studio/briefs/:id", async (req, res) => {
  try {
    const result = await pool.query<{ id: string }>(
      `UPDATE bonanza_briefs
          SET deleted_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id`,
      [req.params.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ ok: true, id: result.rows[0]?.id });
  } catch (err) {
    logger.error({ err }, "brief delete failed");
    res.status(500).json({ error: "could not delete brief" });
  }
});

// ---- Renders (read-only view of bonanza_leads) ---------------------

type RenderRow = {
  id: string;
  vision: string;
  ai_output: string | null;
  email: string;
  source: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
};

router.get("/studio/renders", async (_req, res) => {
  try {
    const result = await pool.query<RenderRow>(
      `SELECT id, vision, ai_output, email, source, user_agent, referrer, created_at
         FROM bonanza_leads
        ORDER BY created_at DESC`,
    );
    res.json({ renders: result.rows });
  } catch (err) {
    logger.error({ err }, "renders list failed");
    res.status(500).json({ error: "could not load renders" });
  }
});

export default router;
