// TODO(socials): replace `#` placeholders with the real account URLs
// when the operator publishes them. Targets: Instagram, YouTube, GitHub,
// LinkedIn. Until then, links are inert and rel="noopener" is omitted
// because there's nowhere to open.
const SOCIALS = [
  { label: 'Instagram', href: '#', handle: '@bonanza.cr8tives' },
  { label: 'YouTube', href: '#', handle: 'Bonanza Cr8tives' },
  { label: 'GitHub', href: '#', handle: 'bonanza-cr8tives' },
  { label: 'LinkedIn', href: '#', handle: 'Bonanza Cr8tives' },
] as const;

export function Connect() {
  return (
    <section
      className="bz-connect"
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
                href={s.href}
                className="bz-connect-link"
                aria-label={`${s.label} — ${s.handle}`}
              >
                <span className="bz-connect-label">{s.label}</span>
                <span className="bz-connect-handle">{s.handle}</span>
                <span className="bz-connect-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
