// Email notification adapter contract. Stage 1 ships the NoOp
// implementation; the real Resend implementation is a one-line swap
// in `./index.ts` once `RESEND_API_KEY` lands. Adapters are the only
// place that touch a real provider — every caller goes through the
// factory so the rest of the codebase has zero coupling to the
// underlying email service.

export type NotificationKind = "brief" | "lead";

export interface SendArgs {
  kind: NotificationKind;
  recipient: string;
  subject: string;
  body: string;
  sourceId: string;
}

export type SendStatus = "sent" | "failed" | "deferred";

export interface SendResult {
  status: SendStatus;
  error?: string;
}

export interface NotificationAdapter {
  readonly name: string;
  send(args: SendArgs): Promise<SendResult>;
}
