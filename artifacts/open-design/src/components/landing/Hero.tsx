import { scrollToId } from '../../lib/scrollToAnchor';

export function Hero() {
  const handleAnchor = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <section className="bz-hero" id="top" aria-labelledby="bz-hero-title">
      <div className="bz-hero-glow" aria-hidden="true" />
      <div className="bz-hero-inner">
        <p className="bz-hero-eyebrow">
          <span className="bz-hero-eyebrow-dot" aria-hidden="true" />
          Bonanza Cr8tives — Studio Notes MMXXVI
        </p>
        <h1 className="bz-hero-title" id="bz-hero-title">
          Websites, AI funnels &amp; digital front doors{' '}
          <span className="bz-hero-title-accent">built for serious founders.</span>
        </h1>
        <p className="bz-hero-sub">
          Bonanza Cr8tives turns your idea into a sharp creative direction, then
          builds the system around it.
        </p>
        <div className="bz-hero-ctas">
          <a
            href="#vision"
            className="bz-cta bz-cta--primary"
            onClick={handleAnchor('vision')}
          >
            Start Your Vision
          </a>
          <a
            href="#what-we-build"
            className="bz-cta bz-cta--ghost"
            onClick={handleAnchor('what-we-build')}
          >
            View What We Build
          </a>
        </div>
      </div>
    </section>
  );
}
