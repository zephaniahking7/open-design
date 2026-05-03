// Before / After — grounded in the actual founder journey we see most
// often. Each pair is one specific friction → one specific outcome.
// Kept intentionally short (4 rows) so the section reads as a scan,
// not a wall of text.
const BEFORE = [
  'A Notes-app pitch nobody can read back to you.',
  'A free site builder that screams free site builder.',
  'No clear path from "they liked it" to "they booked it".',
  'A logo you outgrew six months ago.',
] as const;

const AFTER = [
  'A sharp creative direction your whole team can quote.',
  'A site that looks like the business you\'re actually building.',
  'A funnel that turns interest into a held diary slot.',
  'A brand system you can grow into, not out of.',
] as const;

export function BeforeAfter() {
  return (
    <section
      className="bz-split bz-section--light"
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
