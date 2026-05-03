// "Built by Bonanza Cr8tives." Live ecosystem proof. These are the
// projects currently in motion under the studio. Order is intentional —
// Supreme Teens leads (flagship social platform), then HQ (the operating
// system that powers everything), then the brand and media surfaces.
const PROJECTS = [
  {
    name: 'Supreme Teens',
    pitch: 'Youth platform and positive social network.',
  },
  {
    name: 'Bonanza HQ',
    pitch: 'Internal command centre and studio operating system.',
  },
  {
    name: 'Real Image Entertainment',
    pitch: 'Music, media and talent infrastructure.',
  },
  {
    name: 'Blu Giant',
    pitch: 'Artist brand and creative direction.',
  },
  {
    name: 'Jay Monsoon',
    pitch: 'Clothing store and fashion label.',
  },
  {
    name: 'GrownFlow UK',
    pitch: 'Culture and lifestyle media concept.',
  },
  {
    name: 'BaeJo Jobae',
    pitch: 'Food brand ecosystem.',
  },
] as const;

export function Ecosystem() {
  return (
    <section
      className="bz-ecosystem bz-section--light"
      id="ecosystem"
      aria-labelledby="bz-ecosystem-label"
    >
      <div className="bz-ecosystem-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Ecosystem
        </p>
        <h2 id="bz-ecosystem-label" className="bz-section-title">
          Built by Bonanza Cr8tives.
        </h2>
        <p className="bz-section-sub">
          We don't just talk about building. These are the live projects
          currently in motion under the studio.
        </p>

        <ul className="bz-ecosystem-grid">
          {PROJECTS.map((p, i) => (
            <li key={p.name} className="bz-ecosystem-card">
              <span className="bz-ecosystem-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="bz-ecosystem-name">{p.name}</h3>
              <p className="bz-ecosystem-pitch">{p.pitch}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
