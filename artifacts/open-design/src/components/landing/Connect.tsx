// Public socials only. GitHub is intentionally NOT public-facing —
// internal tooling lives in private orgs. Until real handles are
// published the URLs are TODO(...) placeholders and click-throughs are
// inert via the same pattern used elsewhere on the landing.
const SOCIALS = [
  { label: 'Instagram', href: 'TODO(instagram-link)', handle: '@bonanza.cr8tives' },
  { label: 'YouTube', href: 'TODO(youtube-link)', handle: 'Bonanza Cr8tives' },
  { label: 'LinkedIn', href: 'TODO(linkedin-link)', handle: 'Bonanza Cr8tives' },
] as const;

export function Connect() {
  const handlePlaceholder = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <section
      className="bz-connect bz-section--light bz-section--sky"
      id="connect"
      aria-labelledby="bz-connect-label"
    >
      <div className="bz-connect-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Connect
        </p>
        <h2 id="bz-connect-label" className="bz-section-title">
          Connect With Bonanza.
        </h2>
        <p className="bz-section-sub">
          Follow the build, watch the systems grow, and reach out when you're
          ready to create.
        </p>

        <ul className="bz-connect-list">
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a
                href="#"
                onClick={handlePlaceholder}
                className="bz-connect-link"
                data-todo={s.href}
                aria-label={`${s.label} — ${s.handle} (link coming soon)`}
              >
                <span className="bz-connect-label">{s.label}</span>
                <span className="bz-connect-handle">{s.handle}</span>
                <span className="bz-connect-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
          {/* Fourth visual card — balances the 4-column grid and reframes
              the "before contact" moment with the studio's voice. */}
          <li>
            <div
              className="bz-connect-link bz-connect-link--note"
              aria-hidden="false"
            >
              <span className="bz-connect-label">Bring the rough version</span>
              <span className="bz-connect-handle">
                We'll help shape it into something people can trust.
              </span>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
