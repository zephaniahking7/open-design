import { useState, type FormEvent } from 'react';
import { navigate } from '../router';
import './BonanzaLanding.css';

export function BonanzaLanding() {
  const [vision, setVision] = useState('');

  const enterStudio = (preserveVision: boolean) => {
    if (preserveVision && vision.trim()) {
      try {
        sessionStorage.setItem('bonanza:vision', vision.trim());
      } catch {
        /* sessionStorage may be unavailable; landing still navigates */
      }
    }
    navigate({ kind: 'home' });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    enterStudio(true);
  };

  return (
    <div className="bz-root">
      <div className="bz-shell">
        <header className="bz-header">
          <div className="bz-wordmark">Bonanza Cr8tives</div>
          <a
            className="bz-nav-link"
            href="/studio"
            onClick={(e) => {
              e.preventDefault();
              enterStudio(false);
            }}
          >
            Studio
          </a>
        </header>

        <section className="bz-hero">
          <div className="bz-hero-mast" aria-hidden="true">
            <span className="bz-hero-rule" />
            <span className="bz-hero-eyebrow">Studio Notes</span>
            <span className="bz-hero-date">MMXXVI</span>
          </div>
          <h1 className="bz-hero-title">
            Turn Vision Into <em>Presence</em>
          </h1>
          <p className="bz-hero-sub">
            Most AI builds pages. Bonanza builds presence.
          </p>

          <form className="bz-form" onSubmit={handleSubmit}>
            <input
              className="bz-input"
              type="text"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Describe your vision…"
              aria-label="Describe your vision"
              autoComplete="off"
            />
            <button className="bz-cta" type="submit">
              Render
            </button>
          </form>
        </section>

        <section className="bz-preview" aria-labelledby="bz-preview-label">
          <p id="bz-preview-label" className="bz-section-label">
            Preview
          </p>
          <div className="bz-preview-canvas" role="presentation">
            <p className="bz-preview-empty">
              Your refined output will surface here — clear, intentional, made with care.
            </p>
          </div>
        </section>

        <section className="bz-philosophy" aria-labelledby="bz-philosophy-label">
          <p id="bz-philosophy-label" className="bz-section-label">
            Philosophy
          </p>
          <p className="bz-philosophy-line">We do not build for speed alone.</p>
          <p className="bz-philosophy-line">We build with intention.</p>
          <p className="bz-philosophy-line">Vision becomes presence.</p>
        </section>

        <footer className="bz-footer">
          <span className="bz-footer-brand">Bonanza Cr8tives</span>
          <span className="bz-footer-meta">© 2026 — Quiet Authority</span>
        </footer>
      </div>
    </div>
  );
}
