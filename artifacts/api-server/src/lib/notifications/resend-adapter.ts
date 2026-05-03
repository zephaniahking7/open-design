import type {
  NotificationAdapter,
  SendArgs,
  SendResult,
} from "./adapter";

// Skeleton Resend adapter. Stays inert until both `RESEND_API_KEY`
// and a verified sender (`BONANZA_NOTIFY_FROM`) are present. The
// `resend` npm package is not yet installed; this file uses a
// dynamic import so the build does not depend on it. When the
// connector is authorised, install the package, the dynamic import
// resolves, and the factory in `./index.ts` switches over.
//
// The structure deliberately mirrors what the Resend SDK expects so
// activation is a one-line install, not a rewrite.
export class ResendEmailAdapter implements NotificationAdapter {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
  ) {}

  async send(args: SendArgs): Promise<SendResult> {
    try {
      // Dynamic import so the api-server can build without the
      // `resend` package installed. The factory only constructs this
      // adapter when RESEND_API_KEY is set, but the package install
      // is a separate (later) step — we keep the build green
      // regardless.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let mod: any;
      try {
        mod = await import("resend" as string);
      } catch {
        return {
          status: "failed",
          error: "resend_package_not_installed",
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Resend = (mod as any).Resend;
      if (typeof Resend !== "function") {
        return { status: "failed", error: "resend_module_shape" };
      }
      const client = new Resend(this.apiKey);
      const result = await client.emails.send({
        from: this.fromAddress,
        to: args.recipient,
        subject: args.subject,
        text: args.body,
      });
      if (result?.error) {
        return {
          status: "failed",
          error: String(result.error?.message ?? result.error).slice(0, 500),
        };
      }
      return { status: "sent" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { status: "failed", error: msg.slice(0, 500) };
    }
  }
}
