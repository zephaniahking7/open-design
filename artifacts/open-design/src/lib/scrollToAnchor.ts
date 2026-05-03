// Single source of truth for in-page anchor scrolling on the landing.
// Gates `behavior: 'smooth'` behind `prefers-reduced-motion: reduce` so
// motion-sensitive users get an instant jump instead of a sweep.
export function scrollToId(id: string): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  el.scrollIntoView({
    behavior: reduced ? 'auto' : 'smooth',
    block: 'start',
  });
}
