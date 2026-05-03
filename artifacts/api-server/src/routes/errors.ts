import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireInternal } from "../lib/internal-auth";

// Internal read endpoint for the error log.
//
// The public ingress (POST /api/error) lives in `error-ingress.ts`
// and is mounted at the very top of the middleware chain in app.ts
// so its 4 KB body cap is enforced BEFORE the global JSON parser.
// Keeping ingress out of this file makes that ordering invariant
// obvious.
const router: IRouter = Router();

router.get("/studio/errors", requireInternal, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, source, message, stack, context, user_agent, url, created_at
         FROM bonanza_errors
        ORDER BY created_at DESC
        LIMIT 100`,
    );
    res.json({ errors: result.rows });
  } catch (err) {
    logger.error({ err }, "errors list failed");
    res.status(500).json({ error: "could not load errors" });
  }
});

export default router;
