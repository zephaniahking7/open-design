import type { RequestHandler } from "express";

// TODO real auth — replace this header check with proper session /
// JWT-based auth before exposing the studio outside the team. The
// frontend sets `X-Bonanza-Internal: true` only when
// localStorage.bonanza_internal === 'true', which is itself a
// flag-on-the-honor-system. This middleware exists so the API surface
// has a single chokepoint to upgrade.
export const requireInternal: RequestHandler = (req, res, next) => {
  const header = req.headers["x-bonanza-internal"];
  const value = Array.isArray(header) ? header[0] : header;
  if (value !== "true") {
    res.status(401).json({ error: "internal_only" });
    return;
  }
  next();
};
