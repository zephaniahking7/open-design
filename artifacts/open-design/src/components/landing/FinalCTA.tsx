import { scrollToId } from '../../lib/scrollToAnchor';

export function FinalCTA() {
  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId('vision');
  };

  return (
    <section className="bz-final-cta" aria-labelledby="bz-final-label">
      <div className="bz-final-glow" aria-hidden="true" />
      <div className="bz-final-inner">
        <h2 id="bz-final-label" className="bz-final-title">
          Ready to turn the idea into a real build?
        </h2>
        <p className="bz-final-sub">
          Start with the vision. We'll shape the direction, then build the
          system properly.
        </p>
        <a
          href="#vision"
          onClick={handleStart}
          className="bz-cta bz-cta--primary bz-cta--large"
        >
          Start Your Vision
        </a>
      </div>
    </section>
  );
}
