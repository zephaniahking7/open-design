const BEFORE = [
  'Scattered ideas',
  'Weak online presence',
  'No clear funnel',
  'No strong first impression',
] as const;

const AFTER = [
  'Clear brand direction',
  'Polished website',
  'AI-assisted lead flow',
  'Digital system ready to grow',
] as const;

export function BeforeAfter() {
  return (
    <section
      className="bz-split"
      id="before-after"
      aria-labelledby="bz-split-label"
    >
      <div className="bz-split-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Before / After Bonanza
        </p>
        <h2 id="bz-split-label" className="bz-section-title">
          From rough idea to real digital presence.
        </h2>

        <div className="bz-split-grid">
          <div className="bz-split-col bz-split-col--before">
            <p className="bz-split-tag">Before</p>
            <ul className="bz-split-list">
              {BEFORE.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="bz-split-divider" aria-hidden="true">
            <span className="bz-split-bolt" />
          </div>
          <div className="bz-split-col bz-split-col--after">
            <p className="bz-split-tag bz-split-tag--after">After</p>
            <ul className="bz-split-list bz-split-list--after">
              {AFTER.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
