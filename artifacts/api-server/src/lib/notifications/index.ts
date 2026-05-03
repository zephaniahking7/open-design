import { pool } from "@workspace/db";
import { logger } from "../logger";
import type {
  NotificationAdapter,
  NotificationKind,
  SendResult,
} from "./adapter";
import { NoOpEmailAdapter } from "./no-op-adapter";
import { ResendEmailAdapter } from "./resend-adapter";
import {
  briefTemplate,
  leadTemplate,
  type BriefTemplateInput,
  type LeadTemplateInput,
} from "./templates";

// --- Adapter selection ---------------------------------------------

let cached: NotificationAdapter | null = null;

function selectAdapter(): NotificationAdapter {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["BONANZA_NOTIFY_FROM"];
  if (apiKey && from) {
    logger.info({ adapter: "resend" }, "notification adapter selected");
    return new ResendEmailAdapter(apiKey, from);
  }
  logger.info({ adapter: "noop" }, "notification adapter selected");
  return new NoOpEmailAdapter();
}

export function getNotificationAdapter(): NotificationAdapter {
  if (!cached) cached = selectAdapter();
  return cached;
}

// --- Internal sender rate cap --------------------------------------

const SENDER_WINDOW_MS = 60 * 60 * 1000;
const SENDER_MAX_PER_WINDOW = 30;
const sendTimestamps: number[] = [];

function senderRateOk(): boolean {
  const now = Date.now();
  while (sendTimestamps.length && sendTimestamps[0]! <= now - SENDER_WINDOW_MS) {
    sendTimestamps.shift();
  }
  if (sendTimestamps.length >= SENDER_MAX_PER_WINDOW) return false;
  sendTimestamps.push(now);
  return true;
}

// --- Persistence ---------------------------------------------------

async function recordNotification(args: {
  kind: NotificationKind;
  sourceId: string;
  recipient: string;
  result: SendResult;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO bonanza_notifications
         (type, source_id, recipient, status, error)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        args.kind,
        args.sourceId,
        args.recipient.slice(0, 320),
        args.result.status,
        args.result.error ? args.result.error.slice(0, 500) : null,
      ],
    );
  } catch (err) {
    // Notification logging itself failed — last-resort log only,
    // never throw. The submitter already got their success
    // response; this is purely an operator audit trail.
    logger.error({ err }, "notification audit insert failed");
  }
}

// --- Public API ----------------------------------------------------

interface NotifyArgs {
  kind: NotificationKind;
  sourceId: string;
  data: BriefTemplateInput | LeadTemplateInput;
}

// Fire-and-forget sender. Never awaits in the caller, never throws,
// never blocks the HTTP response. Schedules on `setImmediate` so
// the original handler's `res.json(...)` is flushed before any
// provider work runs.
export function notifyAsync(args: NotifyArgs): void {
  setImmediate(() => {
    void runNotify(args);
  });
}

async function runNotify(args: NotifyArgs): Promise<void> {
  const recipient = (process.env["BONANZA_OPERATOR_EMAIL"] || "").trim();
  if (!recipient) {
    await recordNotification({
      kind: args.kind,
      sourceId: args.sourceId,
      recipient: "",
      result: { status: "failed", error: "no_recipient" },
    });
    return;
  }

  if (!senderRateOk()) {
    await recordNotification({
      kind: args.kind,
      sourceId: args.sourceId,
      recipient,
      result: { status: "deferred", error: "rate_limited" },
    });
    return;
  }

  const { subject, body } =
    args.kind === "brief"
      ? briefTemplate(args.data as BriefTemplateInput)
      : leadTemplate(args.data as LeadTemplateInput);

  let result: SendResult;
  try {
    const adapter = getNotificationAdapter();
    result = await adapter.send({
      kind: args.kind,
      recipient,
      subject,
      body,
      sourceId: args.sourceId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result = { status: "failed", error: msg.slice(0, 500) };
  }

  await recordNotification({
    kind: args.kind,
    sourceId: args.sourceId,
    recipient,
    result,
  });
}
