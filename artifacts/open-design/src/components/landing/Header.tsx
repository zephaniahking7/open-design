import { useEffect, useState } from 'react';
import { navigate } from '../../router';
import { scrollToId } from '../../lib/scrollToAnchor';
import { Wordmark } from '../Wordmark';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchor = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  const handleStudio = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate({ kind: 'home' });
  };

  return (
    <header className={`bz-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="bz-header-inner">
        <a
          href="#top"
          className="bz-header-mark"
          onClick={handleAnchor('top')}
          aria-label="Bonanza Cr8tives — home"
        >
          <Wordmark variant="full" height={28} />
        </a>
        <nav className="bz-header-nav" aria-label="Primary">
          <a href="#what-we-build" onClick={handleAnchor('what-we-build')}>
            Services
          </a>
          <a href="#process" onClick={handleAnchor('process')}>
            Process
          </a>
          <a href="#packages" onClick={handleAnchor('packages')}>
            Packages
          </a>
          <a
            href="/studio"
            onClick={handleStudio}
            className="bz-header-studio"
          >
            Studio
          </a>
        </nav>
      </div>
    </header>
  );
}
