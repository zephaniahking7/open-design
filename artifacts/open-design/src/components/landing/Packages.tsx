import { scrollToId } from '../../lib/scrollToAnchor';

// Package list. The 4th tier (saas) deliberately has no deposit link —
// SaaS builds open with a paid discovery sprint, not a build deposit.
// Payment links are TODO(...) placeholders until the operator publishes
// the live Stripe Pay-by-Link URLs. Until then the buttons render but
// inert via the same `#` + preventDefault pattern used elsewhere.
const PACKAGES = [
  {
    key: 'starter',
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
    fullPaymentLink: 'TODO(starter-full-payment-link)',
    depositLink: 'TODO(starter-deposit-link)',
    feature: false,
  },
  {
    key: 'growth',
    name: 'Growth Website',
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
    fullPaymentLink: 'TODO(growth-full-payment-link)',
    depositLink: 'TODO(growth-deposit-link)',
    feature: true,
  },
  {
    key: 'cr8tive',
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
    fullPaymentLink: 'TODO(cr8tive-full-payment-link)',
    depositLink: 'TODO(cr8tive-deposit-link)',
    feature: false,
  },
  {
    key: 'saas',
    name: 'Web App / SaaS Build',
    price: 'Custom from £5,000+',
    pitch:
      'Custom platform builds for serious founders ready to operate at app or SaaS scale.',
    items: [
      'Scoped product discovery',
      'Architecture and stack direction',
      'Custom UI and flows',
      'Backend, database and auth setup',
      'Staged delivery milestones',
      'Launch and handover plan',
    ],
    fullPaymentLink: null,
    depositLink: 'TODO(saas-discovery-payment-link)',
    feature: false,
  },
] as const;

export function Packages() {
  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId('vision');
  };

  // Inert payment button until real Pay-by-Link URLs are published.
  // Keeps the visual position locked so swap-in is a one-line change.
  const handlePaymentPlaceholder = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId('vision');
  };

  return (
    <section
      className="bz-packages bz-section--light"
      id="packages"
      aria-labelledby="bz-packages-label"
    >
      <div className="bz-packages-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Packages
        </p>
        <h2 id="bz-packages-label" className="bz-section-title">
          Three ways to start. One way to scale.
        </h2>
        <p className="bz-packages-positioning">
          Websites for presence. Systems for growth. Apps and SaaS for serious
          platforms.
        </p>

        <div className="bz-packages-grid">
          {PACKAGES.map((p) => (
            <article
              key={p.key}
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
              <div className="bz-pkg-actions">
                <a
                  href="#vision"
                  onClick={handleStart}
                  className={`bz-cta ${
                    p.feature ? 'bz-cta--primary' : 'bz-cta--ghost'
                  } bz-pkg-cta`}
                >
                  Start Your Vision
                </a>
                <div className="bz-pkg-pay">
                  {p.fullPaymentLink && (
                    <a
                      href="#"
                      onClick={handlePaymentPlaceholder}
                      className="bz-pkg-pay-link"
                      data-todo={p.fullPaymentLink}
                      aria-label={`Pay in full — ${p.name} (link coming soon)`}
                    >
                      Pay in full
                    </a>
                  )}
                  <a
                    href="#"
                    onClick={handlePaymentPlaceholder}
                    className="bz-pkg-pay-link"
                    data-todo={p.depositLink}
                    aria-label={`${
                      p.key === 'saas' ? 'Reserve discovery sprint' : 'Reserve build slot with deposit'
                    } — ${p.name} (link coming soon)`}
                  >
                    {p.key === 'saas' ? 'Reserve discovery sprint' : 'Reserve with deposit'}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="bz-packages-note">
          Final quote depends on scope, content, integrations and timeline.
          Domains, hosting, business email and third-party subscriptions are
          separate unless included in your written build scope.
        </p>
      </div>
    </section>
  );
}
