const STEPS = [
  { name: 'Vision', body: 'You tell us what you want built.' },
  { name: 'Direction', body: 'We shape the idea into a clear digital brief.' },
  { name: 'Design', body: 'We create the visual system and page structure.' },
  { name: 'Build', body: 'We develop the site, funnel or digital experience.' },
  { name: 'Launch', body: 'We publish, test and prepare it for real users.' },
  { name: 'Improve', body: 'We refine based on feedback, speed and conversion.' },
] as const;

export function CreativeOrbit() {
  return (
    <section
      className="bz-orbit"
      id="process"
      aria-labelledby="bz-orbit-label"
    >
      <div className="bz-orbit-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Process
        </p>
        <h2 id="bz-orbit-label" className="bz-section-title">
          The Cr8tive Orbit.
        </h2>
        <p className="bz-section-sub">
          Six moves from a sentence in your head to a system on the open web.
        </p>

        <ol className="bz-orbit-list">
          {STEPS.map((step, i) => (
            <li key={step.name} className="bz-orbit-step">
              <span className="bz-orbit-num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="bz-orbit-body">
                <h3 className="bz-orbit-name">{step.name}</h3>
                <p className="bz-orbit-text">{step.body}</p>
              </div>
              <span className="bz-orbit-rule" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
