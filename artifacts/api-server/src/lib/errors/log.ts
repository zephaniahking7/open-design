import { pool } from "@workspace/db";
import { logger } from "../logger";

const STACK_MAX = 8000;
const MESSAGE_MAX = 2000;
const SOURCE_MAX = 120;
const URL_MAX = 1000;
const USER_AGENT_MAX = 500;
const CONTEXT_BYTES_MAX = 16_000;

export interface LogServerErrorArgs {
  source: string;
  message: string;
  stack?: string | null;
  context?: unknown;
  userAgent?: string | null;
  url?: string | null;
}

function clip(value: string | null | undefined, max: number): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value);
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function safeContext(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    const json = JSON.stringify(value);
    if (!json) return null;
    if (json.length > CONTEXT_BYTES_MAX) {
      // Drop oversized context rather than truncate JSON (which
      // would leave invalid JSON in the column). Replace with a
      // marker so the operator knows context was discarded.
      return JSON.stringify({ truncated: true, bytes: json.length });
    }
    return json;
  } catch {
    return JSON.stringify({ unserialisable: true });
  }
}

// Best-effort error sink. Never throws; if the insert fails (e.g.
// the database is the thing that's broken), the failure is logged
// to the application logger and the caller continues normally.
export async function logServerError(args: LogServerErrorArgs): Promise<void> {
  try {
    const source = clip(args.source, SOURCE_MAX) || "unknown";
    const message = clip(args.message, MESSAGE_MAX) || "(no message)";
    const stack = clip(args.stack, STACK_MAX);
    const context = safeContext(args.context);
    const userAgent = clip(args.userAgent, USER_AGENT_MAX);
    const url = clip(args.url, URL_MAX);

    await pool.query(
      `INSERT INTO bonanza_errors
         (source, message, stack, context, user_agent, url)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
      [source, message, stack, context, userAgent, url],
    );
  } catch (err) {
    logger.error({ err, source: args.source }, "bonanza_errors insert failed");
  }
}
