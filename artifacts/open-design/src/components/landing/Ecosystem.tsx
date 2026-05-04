import { useState } from 'react';

// "Bonanza-built ecosystem brands." Logo-led proof of the live work
// already in motion under the studio. These are NOT external clients —
// they are Bonanza-owned or Bonanza-related brands that have or will
// have websites, apps, stores or platforms built through Bonanza
// Cr8tives. Wording rule lives in public/brand-assets/ASSET-MAP.md.
//
// Stage 4 motion pass: presented as a slow silent left-drifting
// marquee ("logo swim") with Live / Building / Next / Vision status
// chips. Pause-on-hover and prefers-reduced-motion fallback (becomes
// a static centred wrap) handled in BonanzaLanding.css.

type Status = 'Live' | 'Building' | 'Next' | 'Vision';

type Project = {
  name: string;
  logo: string;
  status: Status;
  darkTile?: boolean;
};

// Status mapping (operator-confirmable in next pass):
//   Live     — already trading / shipping under the brand
//   Building — actively in build under Bonanza Cr8tives now
//   Next     — queued for build, brief locked
//   Vision   — on the long-range roadmap, not yet in active build
const PROJECTS: readonly Project[] = [
  { name: 'Supreme Teens',           logo: 'supreme-teens.png',                  status: 'Live' },
  { name: 'Bonanza HQ',              logo: 'bonanza-cr8tives-chrome.png',        status: 'Building', darkTile: true },
  { name: 'Real Image Entertainment',logo: 'real-image-entertainment-black.png', status: 'Live' },
  { name: 'Stomp AI',                logo: 'stomp-ai-colour.png',                status: 'Building' },
  { name: 'Jay Monsoon',             logo: 'jay-monsoon-clothing.png',           status: 'Live', darkTile: true },
  { name: 'GrownFlow UK',            logo: 'grow-flow-logo.png',                 status: 'Next' },
  { name: 'BaeJo Jobae',             logo: 'baejo-jobae-white.png',              status: 'Vision', darkTile: true },
  { name: 'Family Bonanza',          logo: 'family-bonanza-fb-logo.png',         status: 'Vision' },
] as const;

function StatusChip({ status }: { status: Status }) {
  const cls = `bz-eco-chip bz-eco-chip--${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

function MarqueeItem({ project }: { project: Project }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = `/brand-assets/logos/${project.logo}`;
  return (
    <li className="bz-eco-item" aria-label={`${project.name} — ${project.status}`}>
      <div className={`bz-eco-logo${project.darkTile ? ' bz-eco-logo--dark' : ''}`}>
        {!imgFailed ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="bz-eco-logo-fallback">{project.name}</span>
        )}
      </div>
      <p className="bz-eco-name">{project.name}</p>
      <StatusChip status={project.status} />
    </li>
  );
}

export function Ecosystem() {
  // Render the list twice in a single track so the loop seams
  // perfectly at translateX(-50%). The duplicated half is hidden
  // from assistive tech; the original list carries the labels.
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
          Bonanza-built ecosystem brands
        </h2>
        <p className="bz-section-sub">
          A growing family of brands, apps, platforms and creative systems
          shaped through Bonanza Cr8tives.
        </p>

        <div className="bz-eco-marquee" aria-roledescription="ecosystem brand strip">
          <ul className="bz-eco-track" aria-label="Bonanza-built ecosystem brands">
            {PROJECTS.map((p) => (
              <MarqueeItem key={p.name} project={p} />
            ))}
          </ul>
          <ul className="bz-eco-track" aria-hidden="true">
            {PROJECTS.map((p) => (
              <MarqueeItem key={`dup-${p.name}`} project={p} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
