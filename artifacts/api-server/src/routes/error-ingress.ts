import express, {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { logger } from "../lib/logger";
import { logServerError } from "../lib/errors/log";

// Public ingress for client-side error reports.
//
// Spec contract:
//   - Returns 204 ALWAYS (success, rate-limited, parse error,
//     missing message, oversized body — all 204).
//     Echoing any error message would itself drive a client error
//     loop and would also expose internal shape to attackers.
//   - 4 KB body cap, enforced BEFORE the global express.json()
//     parser by mounting this router at the top of the middleware
//     chain in app.ts. The route-level parser here is therefore
//     authoritative.
//   - 20 reports per IP per rolling hour. Over-cap requests are
//     silently dropped (not 429 — see contract above).

const router: IRouter = Router();

// --- bespoke 204-on-cap rate limit ---------------------------------

const WINDOW_MS = 60 * 60 * 1000;
const MAX = 20;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}, WINDOW_MS).unref();

function ipOf(req: Request): string {
  // NOTE: trusts X-Forwarded-For because the Replit deployment
  // sits behind an mTLS-terminating proxy that always sets it.
  // This matches the existing `rate-limit.ts` behaviour for the
  // render and leads routes; do not loosen here without changing
  // those too. Tracked as a Stage 1B item if proxy posture changes.
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0];
  return (
    first?.trim() || req.ip || req.socket.remoteAddress || "unknown"
  );
}

function withinCap(req: Request): boolean {
  const now = Date.now();
  const id = `errors:${ipOf(req)}`;
  const cur = buckets.get(id);
  if (!cur || cur.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (cur.count < MAX) {
    cur.count += 1;
    return true;
  }
  return false;
}

// --- handler chain -------------------------------------------------

const noopRateGate = (req: Request, res: Response, next: NextFunction) => {
  if (!withinCap(req)) {
    // Drain the request stream silently then 204. We do NOT call
    // next(); the body is never parsed for over-cap requests.
    req.on("data", () => {
      /* discard */
    });
    req.on("end", () => {
      res.status(204).end();
    });
    req.on("error", () => {
      if (!res.headersSent) res.status(204).end();
    });
    return;
  }
  next();
};

const parseBody = express.json({ limit: "4kb", strict: true });

const swallowParseErrors = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Body too large, malformed JSON, or any other parser failure:
  // silently 204. Keeps the spec promise of "always 204" and gives
  // attackers no shape to probe against.
  if (!res.headersSent) res.status(204).end();
  // Best-effort breadcrumb so the operator can spot floods.
  logger.debug({ err }, "client error ingress parse failed");
};

router.post(
  "/api/error",
  noopRateGate,
  parseBody,
  swallowParseErrors,
  async (req, res) => {
    try {
      const body = req.body ?? {};
      const source = typeof body.source === "string" ? body.source : "client";
      const message = typeof body.message === "string" ? body.message : "";
      const stack = typeof body.stack === "string" ? body.stack : null;
      const url = typeof body.url === "string" ? body.url : null;
      const context = body.context;
      const userAgent =
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : null;

      if (!message) {
        // Silent drop, still 204.
        res.status(204).end();
        return;
      }

      await logServerError({
        source: source.startsWith("client") ? source : `client:${source}`,
        message,
        stack,
        context,
        userAgent,
        url,
      });
      res.status(204).end();
    } catch (err) {
      logger.error({ err }, "client error ingest failed");
      if (!res.headersSent) res.status(204).end();
    }
  },
);

export default router;
