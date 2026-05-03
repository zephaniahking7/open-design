import { scrollToId } from '../../lib/scrollToAnchor';

const PACKAGES = [
  {
    name: 'Starter Site',
    price: '£499+',
    pitch:
      'One-page landing site for founders who need a clean online presence fast.',
    items: [
      'One-page responsive website',
      'Basic copy structure',
      'Contact/lead form',
      'Mobile optimisation',
      'Launch support',
    ],
    feature: false,
  },
  {
    name: 'Growth Build',
    price: '£1,500+',
    pitch: 'Full website and conversion flow for serious small businesses.',
    items: [
      'Multi-section or multi-page website',
      'Service/offer structure',
      'Lead capture journey',
      'Booking/contact flow',
      'Basic SEO setup',
      'Launch testing',
    ],
    feature: true,
  },
  {
    name: 'Cr8tive System',
    price: '£3,500+',
    pitch:
      'Premium web presence with AI-assisted intake and deeper digital infrastructure.',
    items: [
      'Website or web app front door',
      'AI-assisted intake/brief flow',
      'Backend lead capture',
      'Studio/management workflow',
      'Brand system direction',
      'Priority launch support',
    ],
    feature: false,
  },
] as const;

export function Packages() {
  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId('vision');
  };

  return (
    <section
      className="bz-packages"
      id="packages"
      aria-labelledby="bz-packages-label"
    >
      <div className="bz-packages-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Packages
        </p>
        <h2 id="bz-packages-label" className="bz-section-title">
          Three ways to start.
        </h2>

        <div className="bz-packages-grid">
          {PACKAGES.map((p) => (
            <article
              key={p.name}
              className={`bz-pkg ${p.feature ? 'bz-pkg--feature' : ''}`}
            >
              {p.feature && <span className="bz-pkg-flag">Most chosen</span>}
              <h3 className="bz-pkg-name">{p.name}</h3>
              <p className="bz-pkg-price">{p.price}</p>
              <p className="bz-pkg-pitch">{p.pitch}</p>
              <ul className="bz-pkg-list">
                {p.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a
                href="#vision"
                onClick={handleStart}
                className={`bz-cta ${
                  p.feature ? 'bz-cta--primary' : 'bz-cta--ghost'
                } bz-pkg-cta`}
              >
                Start Your Vision
              </a>
            </article>
          ))}
        </div>

        <p className="bz-packages-note">
          Final quote depends on scope, content, integrations and timeline.
        </p>
      </div>
    </section>
  );
}
