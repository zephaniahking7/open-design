// Composer for the public landing. Owns no state — every section is
// a self-contained child. Cross-section navigation is via in-page
// anchor links (see #vision, #what-we-build, #process, #packages,
// #before-after, #connect). The render + lead flow lives in
// VisionInput.tsx and reuses the same SSE/POST contracts as before.
import './BonanzaLanding.css';
import { Header } from './landing/Header';
import { Hero } from './landing/Hero';
import { VisionInput } from './landing/VisionInput';
import { WhatWeBuild } from './landing/WhatWeBuild';
import { CreativeOrbit } from './landing/CreativeOrbit';
import { BeforeAfter } from './landing/BeforeAfter';
import { Packages } from './landing/Packages';
import { Ecosystem } from './landing/Ecosystem';
import { FinalCTA } from './landing/FinalCTA';
import { Connect } from './landing/Connect';
import { Footer } from './landing/Footer';

export function BonanzaLanding() {
  return (
    <div className="bz-root">
      <Header />
      <main className="bz-main">
        <Hero />
        <VisionInput />
        <WhatWeBuild />
        <CreativeOrbit />
        <BeforeAfter />
        <Packages />
        <Ecosystem />
        <FinalCTA />
        <Connect />
      </main>
      <Footer />
    </div>
  );
}
