import { useEffect, useState } from 'react';
import { scrollToId } from '../../lib/scrollToAnchor';
import { Wordmark } from '../Wordmark';

// Six rotating "Currently —" phrases. Order is deliberate — do not
// shuffle. Each line is one current piece of work.
const NOW_LINES = [
  'Building a record label identity for Real Image Entertainment.',
  'Shaping Supreme Teens — the launch event takes form.',
  'Building BaeJo Jobae — best catering, every cuisine, real chefs.',
  'Drafting Family Bonanza — community at the centre.',
  'Architecting My Afraka — diaspora connection platform.',
  'Designing Supreme Cleans — youth-led, waterless, mobile.',
] as const;

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

export function Footer() {
  const reducedMotion = usePrefersReducedMotion();

  const handleAnchor = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <footer className="bz-footer">
      <div className="bz-footer-giant" aria-hidden="true">
        <Wordmark variant="full" height={140} />
      </div>

      <div className="bz-footer-inner">
        <div className="bz-footer-cta">
          <p className="bz-footer-heading">Ready to build?</p>
          <FooterNow reducedMotion={reducedMotion} />
        </div>

        <div className="bz-footer-cols">
          <div className="bz-footer-col">
            <p className="bz-footer-col-label">Primary</p>
            <a href="#vision" onClick={handleAnchor('vision')}>
              Start a Project
            </a>
            <a href="#what-we-build" onClick={handleAnchor('what-we-build')}>
              View Services
            </a>
          </div>
          <div className="bz-footer-col">
            <p className="bz-footer-col-label">Studio</p>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Privacy
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Terms
            </a>
            <a href="#vision" onClick={handleAnchor('vision')}>
              Contact
            </a>
          </div>
        </div>

        <p className="bz-footer-meta">
          © 2026 Bonanza Cr8tives. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// Footer "Currently —" rotation: dual-buffer crossfade. At any moment
// the current phrase is visible; to swap, the incoming phrase mounts
// on top, opacity 0 → 1 while the outgoing phrase opacity 1 → 0, both
// over 1.2s. Visibility wait + crossfade timers cancel cleanly when
// the tab hides so the phrase index never advances while hidden.
function FooterNow({ reducedMotion }: { reducedMotion: boolean }) {
  const [current, setCurrent] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    let visibleTimer: number | null = null;
    let fadeTimer: number | null = null;
    let nextIndex = 1 % NOW_LINES.length;

    const clearAll = () => {
      if (visibleTimer !== null) {
        window.clearTimeout(visibleTimer);
        visibleTimer = null;
      }
      if (fadeTimer !== null) {
        window.clearTimeout(fadeTimer);
        fadeTimer = null;
      }
    };

    const scheduleTick = () => {
      visibleTimer = window.setTimeout(beginCrossfade, 8000);
    };

    const beginCrossfade = () => {
      visibleTimer = null;
      setIncoming(nextIndex);
      fadeTimer = window.setTimeout(() => {
        fadeTimer = null;
        setCurrent(nextIndex);
        setIncoming(null);
        nextIndex = (nextIndex + 1) % NOW_LINES.length;
        scheduleTick();
      }, 1200);
    };

    const start = () => {
      if (visibleTimer !== null || fadeTimer !== null) return;
      scheduleTick();
    };
    const stop = () => {
      clearAll();
      setIncoming(null);
    };

    if (!document.hidden) start();

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearAll();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  return (
    <span className="bz-footer-now" aria-live="off">
      <span className="bz-footer-now-dot" aria-hidden="true" />
      <span className="bz-footer-now-stack">
        <span
          className={`bz-footer-now-text ${
            incoming !== null ? 'is-leaving' : ''
          }`}
        >
          Currently — {NOW_LINES[current]}
        </span>
        {incoming !== null && (
          <span className="bz-footer-now-text bz-footer-now-text--incoming">
            Currently — {NOW_LINES[incoming]}
          </span>
        )}
      </span>
    </span>
  );
}
