import { useCallback, useEffect, useState } from 'react';

type Theme = {
  id: number;
  file: string;
  label: string;
  palette: string;
};

const THEMES: readonly Theme[] = [
  { id: 1,  file: '01-teal-clean-and-modern.png',                label: 'Clean Tech',          palette: 'teal · aqua · white' },
  { id: 2,  file: '02-orange-pink-vibrant-but-calm.png',         label: 'Bright Warmth',       palette: 'orange · pink · yellow · cream' },
  { id: 3,  file: '03-blue-pink-orange-gradient-pop.png',        label: 'Gradient Pop',        palette: 'blue · pink · orange · black' },
  { id: 4,  file: '04-black-aqua-striking-and-simple.png',       label: 'Midnight Precision',  palette: 'black · charcoal · aqua · gray' },
  { id: 5,  file: '05-purple-yellow-youthful-and-fun.png',       label: 'Playful Impact',      palette: 'purple · yellow · turquoise' },
  { id: 6,  file: '06-teal-rust-cool-and-collected.png',         label: 'Executive Calm',      palette: 'deep teal · aqua · rust · pale blue' },
  { id: 7,  file: '07-ruby-pink-red-and-lively.png',             label: 'Red Energy',          palette: 'ruby · pink · blush · cream' },
  { id: 8,  file: '08-charcoal-rose-texturized-and-dynamic.png', label: 'Textured Edge',       palette: 'charcoal · rose · teal' },
  { id: 9,  file: '09-yellow-plum-effective-accent-colors.png',  label: 'Accent Intelligence', palette: 'yellow · plum · taupe · mauve' },
  { id: 10, file: '10-lime-charcoal-gorgeous-contrast.png',      label: 'Fresh Contrast',      palette: 'lime · charcoal · gray' },
  { id: 11, file: '11-black-white-monochrome-editorial.png',     label: 'Editorial Mono',      palette: 'black · white · gray' },
  { id: 12, file: '12-coral-blue-creative-pop.png',              label: 'Creative Pop',        palette: 'coral · yellow · blue · lavender' },
  { id: 13, file: '13-multi-help-me-choose.png',                 label: 'Help Me Choose',      palette: 'multi-palette · mixed themes' },
  { id: 14, file: '14-green-gold-nature-luxe.png',               label: 'Nature Luxe',         palette: 'forest green · sand · gold · ivory' },
  { id: 15, file: '15-sage-gold-fresh-growth.png',               label: 'Fresh Growth',        palette: 'sage · olive · cream · gold' },
  { id: 16, file: '16-black-gold-bold-culture.png',              label: 'Bold Culture',        palette: 'black · gold · red · navy' },
  { id: 17, file: '17-blush-plum-feminine-modern.png',           label: 'Feminine Modern',     palette: 'blush · pink · plum · cream' },
  { id: 18, file: '18-clay-sand-earth-clay-sand.png',            label: 'Earth & Clay',        palette: 'clay · sand · stone · moss' },
  { id: 19, file: '19-ruby-ivory-deep-ruby-ivory.png',           label: 'Deep Ruby',           palette: 'deep ruby · ivory · gold · blush' },
  { id: 20, file: '20-blush-navy-elegant-yet-approachable.png',  label: 'Elegant Approach',    palette: 'blush · cream · navy · rose' },
] as const;

const FEATURED_IDS = [1, 4, 7, 12, 16, 20];
const MAX_FAVOURITES = 3;
const HELP_ME_CHOOSE_ID = 13;

let _themeSelection: { selected: Theme | null; favourites: Theme[] } = {
  selected: null,
  favourites: [],
};

export function getThemeSelection() {
  return _themeSelection;
}

function imgPath(file: string) {
  return `/brand-assets/theme-previews/${file}`;
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

export function ThemePicker() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const selected = selectedId !== null ? THEMES.find((t) => t.id === selectedId) ?? null : null;

  useEffect(() => {
    _themeSelection = {
      selected,
      favourites: THEMES.filter((t) => favouriteIds.has(t.id)),
    };
  }, [selected, favouriteIds]);

  const handleSelect = useCallback((id: number) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleToggleFavourite = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < MAX_FAVOURITES) {
          next.add(id);
        }
        return next;
      });
    },
    [],
  );

  const handleHelpMeChoose = useCallback(() => {
    setSelectedId(HELP_ME_CHOOSE_ID);
    const el = document.getElementById('theme-picker');
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }, [reducedMotion]);

  const visibleThemes = showAll
    ? THEMES
    : THEMES.filter((t) => FEATURED_IDS.includes(t.id));

  const favouriteThemes = THEMES.filter((t) => favouriteIds.has(t.id));

  return (
    <section className="bz-theme-picker" id="theme-picker" aria-labelledby="bz-theme-label">
      <div className="bz-theme-inner">
        <p className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Visual Direction
        </p>
        <h2 id="bz-theme-label" className="bz-section-title">
          Choose your direction.
        </h2>
        <p className="bz-section-sub">
          Choose the direction you naturally connect with. Bonanza Cr8tives will
          refine the final visual system for your brand, audience and offer.
        </p>

        {selected && (
          <div
            className={`bz-theme-hero${reducedMotion ? '' : ' bz-theme-hero--animated'}`}
            role="img"
            aria-label={`Selected theme: ${selected.label}`}
          >
            <img
              src={imgPath(selected.file)}
              alt={`${selected.label} — ${selected.palette}`}
              className="bz-theme-hero-img"
              loading="lazy"
            />
            <div className="bz-theme-hero-info">
              <span className="bz-theme-hero-label">{selected.label}</span>
              <span className="bz-theme-hero-palette">{selected.palette}</span>
            </div>
          </div>
        )}

        <div
          className="bz-theme-grid"
          role="list"
          aria-label="Visual direction options"
        >
          {visibleThemes.map((theme) => {
            const isSelected = selectedId === theme.id;
            const isFav = favouriteIds.has(theme.id);
            const favFull = favouriteIds.size >= MAX_FAVOURITES && !isFav;

            return (
              <div
                key={theme.id}
                className={`bz-theme-card${isSelected ? ' is-selected' : ''}`}
                role="listitem"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  handleSelect(theme.id);
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(theme.id);
                  }
                }}
                aria-label={`${theme.label}`}
                aria-selected={isSelected}
              >
                <div className="bz-theme-card-img-wrap">
                  <img
                    src={imgPath(theme.file)}
                    alt=""
                    className="bz-theme-card-img"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    className={`bz-theme-heart${isFav ? ' is-active' : ''}`}
                    onClick={(e) => handleToggleFavourite(e, theme.id)}
                    disabled={favFull}
                    aria-label={
                      isFav
                        ? `Remove ${theme.label} from favourites`
                        : favFull
                          ? 'Favourites full (max 3)'
                          : `Add ${theme.label} to favourites`
                    }
                    title={favFull && !isFav ? 'Max 3 favourites' : undefined}
                    aria-pressed={isFav}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={isFav ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                <div className="bz-theme-card-meta">
                  <span className="bz-theme-card-label">{theme.label}</span>
                  <span className="bz-theme-card-palette">{theme.palette}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bz-theme-actions">
          {!showAll && (
            <button
              type="button"
              className="bz-cta bz-cta--ghost"
              onClick={() => setShowAll(true)}
            >
              View all directions
            </button>
          )}
          {selectedId !== HELP_ME_CHOOSE_ID && (
            <button
              type="button"
              className="bz-cta bz-cta--ghost"
              onClick={handleHelpMeChoose}
            >
              Help me choose
            </button>
          )}
        </div>

        {favouriteThemes.length > 0 && (
          <div className="bz-theme-shortlist" aria-label="Your shortlisted directions">
            <p className="bz-theme-shortlist-label">
              Your shortlist ({favouriteThemes.length}/{MAX_FAVOURITES})
            </p>
            <div className="bz-theme-shortlist-row">
              {favouriteThemes.map((t) => (
                <div
                  key={t.id}
                  className={`bz-theme-shortlist-item${selectedId === t.id ? ' is-selected' : ''}`}
                  onClick={() => handleSelect(t.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(t.id);
                    }
                  }}
                  aria-label={`View ${t.label}`}
                >
                  <img
                    src={imgPath(t.file)}
                    alt=""
                    className="bz-theme-shortlist-img"
                    loading="lazy"
                  />
                  <span className="bz-theme-shortlist-name">{t.label}</span>
                  <button
                    type="button"
                    className="bz-theme-shortlist-remove"
                    onClick={(e) => handleToggleFavourite(e, t.id)}
                    aria-label={`Remove ${t.label} from shortlist`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
