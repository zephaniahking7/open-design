import type { NotificationAdapter, SendResult } from "./adapter";

// Default adapter while no email provider is connected. Returns
// `deferred` for every call — the caller (notifyAsync) records the
// row in `bonanza_notifications` so the operator has a complete
// audit trail of every brief / lead that would have triggered an
// email. When the real adapter activates, those deferred rows stay
// as historical record; new sends are written as `sent` / `failed`.
export class NoOpEmailAdapter implements NotificationAdapter {
  readonly name = "noop";

  async send(): Promise<SendResult> {
    return { status: "deferred", error: "no_provider" };
  }
}
