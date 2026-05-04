// Composer for the public landing.
//
// IA spine (locked Stage 4 — May 2026):
//   Hero
//     -> Vision builder (Start Your Vision)
//       -> Ecosystem (Bonanza-built brands marquee w/ Live/Building/Next/Vision)
//         -> What We Build
//           -> ThemePicker (Client Visual Direction Picker — 20 themes)
//           -> FontPicker  (Font Personality Picker — 12 directions)
//             -> Packages
//               -> CreativeOrbit (process reinforcement)
//                 -> BeforeAfter (proof reinforcement)
//                   -> FinalCTA (closer)
//                     -> Connect (lead capture)
//                       -> Footer
//
// Cross-section navigation is via in-page anchor links
// (#vision, #ecosystem, #what-we-build, #packages, #process,
// #before-after, #connect). The render + lead flow lives in
// VisionInput.tsx and reuses the same SSE/POST contracts as before.
import './BonanzaLanding.css';
import { Header } from './landing/Header';
import { Hero } from './landing/Hero';
import { VisionInput } from './landing/VisionInput';
import { Ecosystem } from './landing/Ecosystem';
import { WhatWeBuild } from './landing/WhatWeBuild';
import { Packages } from './landing/Packages';
import { CreativeOrbit } from './landing/CreativeOrbit';
import { BeforeAfter } from './landing/BeforeAfter';
import { FinalCTA } from './landing/FinalCTA';
import { Connect } from './landing/Connect';
import { Footer } from './landing/Footer';
import { ThemePicker } from './landing/ThemePicker';
import { FontPicker } from './landing/FontPicker';

export function BonanzaLanding() {
  return (
    <div className="bz-root">
      <Header />
      <main className="bz-main">
        <Hero />
        <VisionInput />
        <Ecosystem />
        <WhatWeBuild />
        <ThemePicker />
        <FontPicker />
        <Packages />
        <CreativeOrbit />
        <BeforeAfter />
        <FinalCTA />
        <Connect />
      </main>
      <Footer />
    </div>
  );
}
