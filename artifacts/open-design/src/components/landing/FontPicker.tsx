import { useCallback, useEffect, useRef, useState } from 'react';

type FontDirection = {
  id: string;
  name: string;
  family: string;
  cssFamily: string;
  headline: string;
  paragraph: string;
  bestFor: string;
  status: 'production-ready' | 'preview-only';
  src: string;
  weight: string;
};

const DIRECTIONS: readonly FontDirection[] = [
  {
    id: 'plus-jakarta',
    name: 'Balanced Modern',
    family: 'Plus Jakarta Sans',
    cssFamily: "'Plus Jakarta Sans'",
    headline: 'The weight of good taste.',
    paragraph: 'A variable geometric sans that scales from whisper-light labels to heavy display headlines without losing warmth. Already tuned for screens.',
    bestFor: 'Websites, apps, clean brands',
    status: 'production-ready',
    src: '/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2',
    weight: '200 800',
  },
  {
    id: 'gabarito',
    name: 'Clean Geometric',
    family: 'Gabarito',
    cssFamily: "'Gabarito Picker'",
    headline: 'Precision without pretence.',
    paragraph: 'Open geometry and generous x-height give Gabarito a friendly-yet-sharp personality. Strong at any size, especially body copy.',
    bestFor: 'Tech brands, startups, modern portfolios',
    status: 'production-ready',
    src: '/fonts/custom/gabarito/Gabarito[wght].woff2',
    weight: '400 900',
  },
  {
    id: 'saira',
    name: 'Street Culture',
    family: 'Saira',
    cssFamily: "'Saira Picker'",
    headline: 'Built for the concrete.',
    paragraph: 'Condensed proportions, squared terminals and a wide weight range give Saira an urban, no-nonsense attitude. Pairs naturally with sport and streetwear.',
    bestFor: 'Streetwear, music, youth brands',
    status: 'production-ready',
    src: '/fonts/custom/saira/Saira-Bold.woff2',
    weight: '700',
  },
  {
    id: 'apfel-grotezk',
    name: 'Soft Humanist',
    family: 'Apfel Grotezk',
    cssFamily: "'Apfel Grotezk Picker'",
    headline: 'Warmth in every curve.',
    paragraph: 'A hand-finished grotesque with intentional optical imperfections that feel human. Regular, Mittel and Fett weights give gentle tonal range.',
    bestFor: 'Wellness, creative agencies, personal brands',
    status: 'production-ready',
    src: '/fonts/custom/apfel-grotezk/ApfelGrotezk-Regular.woff2',
    weight: '400',
  },
  {
    id: 'coconat',
    name: 'Editorial Luxury',
    family: 'Coconat',
    cssFamily: "'Coconat Picker'",
    headline: 'Effortless editorial.',
    paragraph: 'High-contrast strokes, ball terminals and a slightly condensed stance. Coconat reads as magazine-level luxury without overstatement.',
    bestFor: 'Fashion, beauty, lifestyle brands',
    status: 'production-ready',
    src: '/fonts/custom/coconat/Coconat-Bold.woff2',
    weight: '700',
  },
  {
    id: 'mazius-display',
    name: 'Classic Display',
    family: 'Mazius Display',
    cssFamily: "'Mazius Display Picker'",
    headline: 'Heritage meets drama.',
    paragraph: 'Didone-inspired high contrast with generous swash details. Mazius Display is built for hero moments, not body copy — one line that stops the scroll.',
    bestFor: 'Luxury brands, editorial, high-end retail',
    status: 'production-ready',
    src: '/fonts/custom/mazius-display/MaziusDisplay-Bold.woff2',
    weight: '700',
  },
  {
    id: 'ronzino',
    name: 'Bold Impact',
    family: 'Ronzino',
    cssFamily: "'Ronzino Picker'",
    headline: 'Hit hard. Leave a mark.',
    paragraph: 'Ultra-bold condensed display face with ink-trap details. Ronzino dominates a page — use it for headlines that need to own the room.',
    bestFor: 'Headlines, campaigns, bold statements',
    status: 'production-ready',
    src: '/fonts/custom/ronzino/Ronzino-Bold.woff2',
    weight: '700',
  },
  {
    id: 'halibut',
    name: 'Tech Future',
    family: 'Halibut',
    cssFamily: "'Halibut Picker'",
    headline: 'Forward-facing precision.',
    paragraph: 'Mechanical mono-width proportions with optical corrections. Halibut reads as data-driven and futuristic — strong in condensed or expanded widths.',
    bestFor: 'Tech companies, SaaS, innovation brands',
    status: 'production-ready',
    src: '/fonts/custom/halibut/Halibut-ExpandedRegular.woff2',
    weight: '400',
  },
  {
    id: 'sinistre',
    name: 'Cinematic Drama',
    family: 'Sinistre',
    cssFamily: "'Sinistre Picker'",
    headline: 'Dark-stage atmosphere.',
    paragraph: 'Variable blackletter-adjacent display face. Sinistre carries gravity and atmosphere — ideal for event branding, title sequences and immersive storytelling.',
    bestFor: 'Film, entertainment, event branding',
    status: 'production-ready',
    src: '/fonts/custom/sinistre/SinistreVF.woff2',
    weight: '400',
  },
  {
    id: 'aujournuit',
    name: 'Night Editorial',
    family: 'Aujournuit',
    cssFamily: "'Aujournuit Picker'",
    headline: 'Between day and dark.',
    paragraph: 'A variable display serif with sharp, angular contrast. Aujournuit works where editorial meets nightlife — magazine covers, brand statements, premium print.',
    bestFor: 'Nightlife, premium editorial, art direction',
    status: 'production-ready',
    src: '/fonts/custom/aujournuit/Aujournuit-VariableVF.woff2',
    weight: '400',
  },
  {
    id: 'sprat',
    name: 'Architectural Display',
    family: 'Sprat',
    cssFamily: "'Sprat Picker'",
    headline: 'Structure with nerve.',
    paragraph: 'Exaggerated contrast serif with variable width axis. Sprat reads as intellectual and avant-garde — perfect for studios, galleries and design-forward brands.',
    bestFor: 'Architecture, design studios, avant-garde',
    status: 'production-ready',
    src: '/fonts/custom/sprat/Sprat-Bold.woff2',
    weight: '700',
  },
  {
    id: 'climate-crisis',
    name: 'Expressive Variable',
    family: 'Climate Crisis',
    cssFamily: "'Climate Crisis Picker'",
    headline: 'Words that shift.',
    paragraph: 'A variable display face whose letterforms morph along a custom axis — from clean type to melting shapes. Statement-level only.',
    bestFor: 'Activism, impact brands, awareness campaigns',
    status: 'production-ready',
    src: '/fonts/custom/climate-crisis/ClimateCrisis-Variable.woff2',
    weight: '400',
  },
] as const;

let _fontSelection: {
  primary: FontDirection | null;
  backup: FontDirection | null;
  recommendForMe: boolean;
} = {
  primary: null,
  backup: null,
  recommendForMe: false,
};

export function getFontSelection() {
  return _fontSelection;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function useInView(ref: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

export function FontPicker() {
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [backupId, setBackupId] = useState<string | null>(null);
  const [recommendForMe, setRecommendForMe] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef);
  const reducedMotion = usePrefersReducedMotion();

  const primary = primaryId ? DIRECTIONS.find((d) => d.id === primaryId) ?? null : null;
  const backup = backupId ? DIRECTIONS.find((d) => d.id === backupId) ?? null : null;

  useEffect(() => {
    _fontSelection = { primary, backup, recommendForMe };
  }, [primary, backup, recommendForMe]);

  const handleSetPrimary = useCallback((id: string) => {
    setPrimaryId((prev) => (prev === id ? null : id));
    setRecommendForMe(false);
  }, []);

  const handleSetBackup = useCallback((id: string) => {
    setBackupId((prev) => (prev === id ? null : id));
    setRecommendForMe(false);
  }, []);

  const handleRecommend = useCallback(() => {
    setRecommendForMe(true);
    setPrimaryId(null);
    setBackupId(null);
  }, []);

  const fontFaceRules = DIRECTIONS.map(
    (d) =>
      `@font-face { font-family: ${d.cssFamily}; src: url('${d.src}') format('woff2'); font-weight: ${d.weight}; font-style: normal; font-display: swap; }`,
  ).join('\n');

  return (
    <section
      className="bz-font-picker"
      id="font-picker"
      aria-labelledby="bz-font-label"
      ref={sectionRef}
    >
      {inView && <style dangerouslySetInnerHTML={{ __html: fontFaceRules }} />}

      <div className="bz-font-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Font Direction
        </p>
        <h2 id="bz-font-label" className="bz-section-title">
          Choose your type personality.
        </h2>
        <p className="bz-section-sub">
          Choose the direction you naturally connect with. Bonanza Cr8tives will
          refine the final font pairing for readability, mobile performance and
          brand fit.
        </p>

        {(primary || backup || recommendForMe) && (
          <div className="bz-font-selection-bar">
            {recommendForMe && (
              <div className="bz-font-selection-tag bz-font-selection-tag--recommend">
                Recommend for me — Bonanza will choose the best pairing
              </div>
            )}
            {primary && (
              <div className="bz-font-selection-tag">
                <span className="bz-font-selection-role">Primary</span>
                <span
                  className="bz-font-selection-name"
                  style={{ fontFamily: `${primary.cssFamily}, system-ui, sans-serif` }}
                >
                  {primary.name}
                </span>
              </div>
            )}
            {backup && (
              <div className="bz-font-selection-tag">
                <span className="bz-font-selection-role">Backup</span>
                <span
                  className="bz-font-selection-name"
                  style={{ fontFamily: `${backup.cssFamily}, system-ui, sans-serif` }}
                >
                  {backup.name}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          className="bz-font-grid"
          role="list"
          aria-label="Font direction options"
        >
          {DIRECTIONS.map((dir) => {
            const isPrimary = primaryId === dir.id;
            const isBackup = backupId === dir.id;
            const isSelected = isPrimary || isBackup;

            return (
              <article
                key={dir.id}
                className={`bz-font-card${isSelected ? ' is-selected' : ''}${isPrimary ? ' is-primary' : ''}${isBackup ? ' is-backup' : ''}`}
                role="listitem"
              >
                <div className="bz-font-card-header">
                  <h3 className="bz-font-card-name">{dir.name}</h3>
                  <span className="bz-font-card-family">{dir.family}</span>
                  <span className={`bz-font-card-status bz-font-card-status--${dir.status}`}>
                    {dir.status === 'production-ready' ? 'Production ready' : 'Preview only'}
                  </span>
                </div>

                <div className="bz-font-card-preview">
                  {inView && (
                    <>
                      <p
                        className="bz-font-card-headline"
                        style={{ fontFamily: `${dir.cssFamily}, system-ui, sans-serif` }}
                      >
                        {dir.headline}
                      </p>
                      <p
                        className="bz-font-card-paragraph"
                        style={{ fontFamily: `${dir.cssFamily}, system-ui, sans-serif` }}
                      >
                        {dir.paragraph}
                      </p>
                    </>
                  )}
                </div>

                <p className="bz-font-card-bestfor">
                  Best for: {dir.bestFor}
                </p>

                <div className="bz-font-card-actions">
                  <button
                    type="button"
                    className={`bz-font-btn${isPrimary ? ' is-active' : ''}`}
                    onClick={() => handleSetPrimary(dir.id)}
                    aria-pressed={isPrimary}
                    disabled={isBackup}
                  >
                    {isPrimary ? '✓ Primary' : 'Choose primary'}
                  </button>
                  <button
                    type="button"
                    className={`bz-font-btn bz-font-btn--secondary${isBackup ? ' is-active' : ''}`}
                    onClick={() => handleSetBackup(dir.id)}
                    aria-pressed={isBackup}
                    disabled={isPrimary}
                  >
                    {isBackup ? '✓ Backup' : 'Choose backup'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="bz-font-actions">
          <button
            type="button"
            className={`bz-cta ${recommendForMe ? 'bz-cta--primary' : 'bz-cta--ghost'}`}
            onClick={handleRecommend}
            aria-pressed={recommendForMe}
          >
            {recommendForMe ? '✓ Recommend for me' : 'Recommend for me'}
          </button>
        </div>
      </div>
    </section>
  );
}
