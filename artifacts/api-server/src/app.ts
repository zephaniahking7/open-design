import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import errorIngressRouter from "./routes/error-ingress";
import { logger } from "./lib/logger";
import { logServerError } from "./lib/errors/log";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// IMPORTANT: error ingress is mounted BEFORE the global JSON parser
// so its route-local 4 KB body cap is authoritative. If express.json()
// runs first, the global ~100 KB limit applies and the route-level
// limit becomes a no-op. Do not move this line below express.json().
app.use(errorIngressRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Global safety-net error middleware. Per-handler try/catches with
// tailored messages still run first; this catches anything that
// escapes (sync throws, forgotten try, etc), logs to bonanza_errors,
// and returns a generic 500 with no stack leak.
app.use(
  (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack ?? null : null;
    void logServerError({
      source: `route:${req.method} ${req.path}`,
      message,
      stack,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : null,
      url: req.originalUrl,
    });
    if (res.headersSent) return;
    res.status(500).json({ error: "server_error" });
  },
);

export default app;
