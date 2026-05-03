const SERVICES = [
  {
    title: 'Websites That Convert',
    body: 'High-trust websites for founders, creatives and small businesses who need to look serious fast.',
  },
  {
    title: 'Landing Pages',
    body: 'Focused one-page builds for campaigns, launches, services and offers.',
  },
  {
    title: 'AI Funnels',
    body: 'Smart intake flows that capture ideas, qualify leads and turn interest into action.',
  },
  {
    title: 'Booking Systems',
    body: 'Clean client journeys from first click to confirmed enquiry.',
  },
  {
    title: 'Brand Systems',
    body: 'Visual direction, messaging structure and digital presence that feels consistent.',
  },
  {
    title: 'Creative Direction',
    body: 'Strategy, design taste and execution support for founders building something bigger.',
  },
] as const;

export function WhatWeBuild() {
  return (
    <section
      className="bz-services bz-section--light"
      id="what-we-build"
      aria-labelledby="bz-services-label"
    >
      <div className="bz-services-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          What We Build
        </p>
        <h2 id="bz-services-label" className="bz-section-title">
          Six surfaces. One studio.
        </h2>

        <div className="bz-services-grid">
          {SERVICES.map((s, i) => (
            <article key={s.title} className="bz-card">
              <span className="bz-card-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="bz-card-title">{s.title}</h3>
              <p className="bz-card-body">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
