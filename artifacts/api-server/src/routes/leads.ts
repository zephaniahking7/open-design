import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { rateLimit } from "../lib/rate-limit";
import { notifyAsync } from "../lib/notifications";

const router: IRouter = Router();

// 10 lead submissions per IP per hour. Higher than render because typing
// the wrong email and resubmitting is a normal user pattern; still
// blocks junk-floods.
router.use(
  "/leads",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10, key: "leads" }),
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" ? v.trim().slice(0, n) : null;

router.post("/leads", async (req, res) => {
  const vision = cap(req.body?.vision, 2000);
  const aiOutput = cap(req.body?.ai_output, 2000);
  const email = cap(req.body?.email, 320);
  const userAgent = cap(req.body?.user_agent, 500);
  const referrer = cap(req.body?.referrer, 500);

  if (!vision) {
    res.status(400).json({ error: "vision is required" });
    return;
  }
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: "valid email is required" });
    return;
  }

  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO bonanza_leads
         (vision, ai_output, email, source, user_agent, referrer)
       VALUES ($1, $2, $3, 'landing', $4, $5)
       RETURNING id`,
      [vision, aiOutput, email, userAgent, referrer],
    );
    const leadId = result.rows[0]?.id;
    res.status(201).json({ ok: true, id: leadId });

    // Fire-and-forget operator notification. Wrapped in try so a
    // synchronous schedule failure can never escape this handler;
    // notifyAsync itself is also fully isolated.
    if (leadId) {
      try {
        notifyAsync({
          kind: "lead",
          sourceId: leadId,
          data: { leadId, email, vision, aiOutput },
        });
      } catch (err) {
        logger.error({ err }, "lead notification schedule failed");
      }
    }
  } catch (err) {
    logger.error({ err }, "lead insert failed");
    res.status(500).json({ error: "could not save lead" });
  }
});

export default router;
