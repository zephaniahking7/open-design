# Bonanza Cr8tives — Launch Notes

Operational notes for taking the public landing live. Stage 1 ships
with placeholders and an inert email adapter; this document tracks
exactly what to swap when going to production.

## 1. Domain placeholder

The placeholder domain is `https://bonanzacr8tives.com/`.

Files containing the placeholder:

- `artifacts/open-design/public/robots.txt` — `Sitemap:` line
- `artifacts/open-design/public/sitemap.xml` — `<loc>` element
- `artifacts/api-server/src/lib/notifications/templates.ts` — fallback
  for `studioUrl` when `PUBLIC_BASE_URL` is unset

When the real domain is connected:

1. Set the environment variable `PUBLIC_BASE_URL` (no trailing slash)
   in production. Example: `PUBLIC_BASE_URL=https://example.com`. The
   notification templates pick this up at send time, so no rebuild is
   needed for the studio link in operator emails.
2. Replace the placeholder in `robots.txt` and `sitemap.xml` and
   rebuild the open-design artifact (`pnpm --filter
   @workspace/open-design run build`).
3. Update `<lastmod>` in `sitemap.xml` to the current date.

## 2. Email provider activation

Stage 1 ships the `NoOpEmailAdapter`. Every brief and lead is logged
to `bonanza_notifications` with `status='deferred'`. Submitters never
see a delay or error, regardless of provider state.

To activate real sending (recommended provider: Resend):

1. Authorise the Resend connector via the Replit integrations panel.
   This populates `RESEND_API_KEY` in the credential proxy.
2. Provide the operator recipient address as a secret:
   `BONANZA_OPERATOR_EMAIL=ops@bonanzacr8tives.com` (or whichever
   inbox should receive notifications).
3. Provide the verified sender address as a secret:
   `BONANZA_NOTIFY_FROM="Bonanza Cr8tives <notifications@bonanzacr8tives.com>"`.
   Use `onboarding@resend.dev` while testing — Resend allows it with
   no DNS setup.
4. Verify the sender domain in Resend (SPF + DKIM records added at
   the DNS provider). DMARC alignment is recommended but not
   required by Resend for delivery.
5. Restart the api-server workflow. The factory in
   `artifacts/api-server/src/lib/notifications/index.ts` will detect
   `RESEND_API_KEY` on next request and switch from NoOp to Resend
   automatically — no code change required.

Legacy fallback (SendGrid): the same factory pattern can be used.
Set `SENDGRID_API_KEY` and adjust the factory file to wire a
`SendgridAdapter` (not shipped in this pass).

## 3. Notification rate cap

The sender has a built-in safety: 30 sends per rolling hour across
all types. Anything above is logged with `status='deferred'` and
`error='rate_limited'` so the operator inbox cannot be weaponised by
form-spammers (the public lead route already enforces 10/hr per IP,
this is a second-line defence).

## 4. Error reporting endpoint

`POST /api/error` is public so the landing can report client-side
errors. Defences in place:

- 20 reports per IP per hour
- 4 KB body cap
- Strict whitelist of fields (`source`, `message`, `stack`,
  `context`, `url`)
- Stack truncated to 8 KB before insert
- Returns 204 always — no response body that could drive a loop

`GET /api/studio/errors` is gated by the existing
`X-Bonanza-Internal: true` header (matches all other studio routes).

## 5. Bundle splitting

Stage 1 lazy-loads the studio + project IDE so the public landing
ships only what's needed for the brand front door. If you add new
top-level surfaces (e.g. `/about`, `/work`), keep them eager only if
they're public; lazy-load anything operator-facing.

## 6. SEO posture

`robots.txt` allows the landing only; `/studio`, `/projects/`, and
`/api/` are disallowed. The studio is also gated client-side by the
`bonanza_internal` localStorage flag and server-side by the
`X-Bonanza-Internal` header. Crawlers should never see operator
surfaces, but the gates are the source of truth — robots.txt is
politeness, not enforcement.
