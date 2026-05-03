import type { Request, RequestHandler } from "express";

type Bucket = { count: number; resetAt: number };

const ipOf = (req: Request): string => {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0];
  return (first?.trim() || req.ip || req.socket.remoteAddress || "unknown");
};

export function rateLimit(opts: {
  windowMs: number;
  max: number;
  key?: string;
}): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const label = opts.key ?? "default";

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }, Math.max(opts.windowMs, 60_000)).unref();

  return (req, res, next) => {
    const now = Date.now();
    const id = `${label}:${ipOf(req)}`;
    const cur = buckets.get(id);
    if (!cur || cur.resetAt <= now) {
      buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    if (cur.count < opts.max) {
      cur.count += 1;
      return next();
    }
    const retryAfter = Math.ceil((cur.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "rate_limited", retry_after: retryAfter });
  };
}
