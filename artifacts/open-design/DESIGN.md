# Bonanza Cr8tives — Identity System (Stage 3)

Single source of truth for the Bonanza Cr8tives visual language. Supersedes
`/system/huashu.md` (cream / tile-green / Cormorant), which has been reduced
to a one-line pointer back to this file.

## Authority order

1. **Wordmark SVG** (`artifacts/open-design/public/brand/wordmark.svg`) — the literal mark.
2. **This file** (DESIGN.md) — definitions, rules, rationale.
3. `/system/huashu.md` — critique methodology applied AFTER implementation; not a definition.

## Surface decision (no dark mode)

Bonanza Cr8tives commits to a single surface system. `prefers-color-scheme`
is detected only to ensure no system preference forces unintended inversion.
The site stays in its designed surface regardless of OS preference. This is
intentional brand discipline, not a missing feature.

### Stage 3 motion grammar (Hero + VisionInput)

Hero entrance is **load-in only** — no cursor tracking, no
WebGL, no shader libraries, no JS-driven animation. The grammar:

- **Stagger:** eyebrow 80ms → title 200ms → sub 380ms → CTAs 520ms.
- **Per-block:** 700ms duration, `cubic-bezier(0.16, 1, 0.3, 1)`, fade
  in + 12px rise.
- **Glow drift:** 18s slow alternate translate (≤1.5%) + scale (≤1.04)
  — ambient, not interactive.
- **Reduced motion:** all hero entrance animations are inert; copy
  appears at final position with no transform, glow does not drift.

VisionInput render theatre is **CSS-only refinement** of existing
state — render/lead JS logic is untouched:

- **Composing state:** three pink dots pulse on a 160ms stagger
  (replaces single growing rule). 1.2s ease-in-out, infinite.
- **Signature word:** pink halo fades in behind the word 600ms after
  underline begins (700ms ease) — surface treatment, not on mark.
- **Preview canvas:** soft top-down surface gradient + a 1px pink
  proscenium rule across the top edge.
- **Maker's mark + voice-line + lead row:** existing 1000ms / 2400ms
  / 3500ms timing preserved verbatim.

### Stage 3 launch amendment (ratified)

**The public landing surface inverts to bz-black dominant for launch.** The
MISSION brief calls for a premium creative-tech register: black/near-black
base, white and soft-grey type, electric accents only where useful. This
supersedes the original bz-pink-dominant hero in the Section dominance table
below.

What remains unchanged:
- Wordmark and monogram (Concept C — Brixton Hand) — exact paths.
- Satoshi via Fontshare as the single body face.
- 8-unit grid, motion timing (600 ms underline, +1000 ms mark, +2400 ms
  voice line), `prefers-reduced-motion` discipline.
- All anti-patterns below.

What changes:
- Dominant surface = bz-black (was bz-pink hero, bz-white render).
- bz-pink demoted from dominant to **identity-defining accent**: signature
  word underline, primary CTA fill, hero glow, focus rings, micro-rules.
- Body type renders white on bz-black (was bz-ink on bz-white).
- Studio surface is **deferred** — kept on its existing palette until a
  follow-up restyle pass.

Section dominance for launch (see updated table below the original).

| Section          | Dominant  | Accent                                | Type colour |
|------------------|-----------|---------------------------------------|-------------|
| Header           | bz-black  | bz-pink on hover for Studio CTA       | white       |
| Hero             | bz-black  | bz-pink radial glow + primary CTA     | white       |
| Vision Intake    | bz-black  | bz-pink focus ring on input           | white       |
| What We Build    | bz-black  | bz-pink hover top-rule on cards       | white       |
| Cr8tive Orbit    | bz-elev   | bz-pink step numerals                 | white       |
| Before / After   | bz-black  | bz-pink "after" markers + bolt        | white       |
| Packages         | bz-elev   | bz-pink border on featured tier       | white       |
| Final CTA        | bz-black  | bz-pink radial glow under CTA         | white       |
| Connect          | bz-elev   | bz-pink hover arrow on social links   | white       |
| Footer           | bz-black  | bz-pink "Currently —" dot             | white       |

## Palette

| Token      | Hex      | Role                                                                                                |
|------------|----------|-----------------------------------------------------------------------------------------------------|
| bz-pink    | #FF2E88  | Identity-defining accent. Hero surface. Signature underline. Dominant + accent ONLY — never body copy. |
| bz-teal    | #00B5A1  | Secondary accent. One element per section maximum.                                                  |
| bz-yellow  | #FFD400  | Tertiary accent. Reserved for the booking-section CTA underline.                                    |
| bz-black   | #0B0B0B  | Booking surface. Type on white / pink / yellow surfaces.                                            |
| bz-ink     | #141414  | Body-text default (slightly off-pure-black, WCAG AA on bz-white).                                   |
| bz-white   | #FFFFFF  | Render canvas, footer, app-icon ground.                                                             |
| bz-paper   | #FAFAF7  | Optional warm-white for soft sections; never within hero or booking.                                |

- bz-pink contrast against bz-white: 4.6:1 — passes AA Large (≥18px). For
  body copy on white, always use bz-ink.
- bz-pink OLED behaviour: tested on white, black, OLED. If on-device blooming
  is observed in production telemetry, reduce L by 2–3% before C/H. Document
  the change here, not in component code.
- The wordmark must work in three combinations: pink on white, black on
  white, white on pink.

## Section dominance (page rhythm)

| Section  | Dominant  | Accent                                | Type colour |
|----------|-----------|---------------------------------------|-------------|
| Hero     | bz-pink   | bz-white type, bz-yellow micro-rule   | bz-white    |
| Render   | bz-white  | bz-pink underline (signature word ONLY) | bz-ink    |
| Voice    | bz-white  | thin bz-teal rule                     | bz-ink      |
| Booking  | bz-black  | bz-yellow CTA underline               | bz-white    |
| Footer   | bz-white  | none                                  | bz-ink      |

One dominant colour per section. No two competing.

## Type system

- Display + body: **Satoshi** by Indian Type Foundry. Free for commercial use.
- Served via **Fontshare** — `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`.
- Latin subset only at Stage 3.
- Weights in use: 400 (body), 500 (UI labels), 700 (display H2/H3), 900
  (display H1, voice lines, render sentence).
- No Söhne, no Inter, no Cormorant Garamond, no Instrument Sans.

Type rules:

- Voice lines: Satoshi 900 italic on bz-white, never on bz-pink.
- Body copy: Satoshi 400 in bz-ink — never bz-pink (fails AA at body sizes).
- All-caps labels: Satoshi 500, tracking +0.16em.

## Wordmark — Concept C: Brixton Hand

All-caps, two-row stacked lockup. Custom-drawn letterforms with selective
wedge serifs and a held, bowl-balanced 8.

### Construction

- Cap height 100 units, stem weight 14 units.
- Round letters overshoot baseline + cap top by 2 units (optical correction).
- Wedge serifs: 6-unit depth, 12° from horizontal.
- **Wedge serif discipline (refinement #3):** serifs only on letters where
  they improve silhouette clarity at small sizes — B, I, T, A, C, R, Z.
  Letters that don't benefit (O, N, V, E, S, 8) carry no serifs. Reduction
  is preferred over consistency.
- Counter widths +4% versus geometric sans norm — the open Caribbean-signage
  feeling, not a tight corporate sans.

### The 8 — held, not constructed (refinement #1)

- Two bowls of unequal weight: upper 12-unit stroke, lower 15-unit stroke.
- Junction at y=46% (below geometric centre) — weight settles low.
- **Held bar at midline with 1-unit upward curvature at centre** — reads as
  tension, not structure. The 8 must feel held, not constructed.

### Lockup

- Two rows: BONANZA / CR8TIVES, flush left.
- Tracking: BONANZA +20, CR8TIVES +60 — optical widths matched within ±2%.
- Leading: tight stack; baseline-to-baseline = **110% of cap height**
  (refinement on the original 92% spec — 92% caused row collision in
  implementation; 110% ratified here as the production value).
- **Tracking lock — non-negotiable (refinement #4):** never auto-adjust at
  runtime. Lockup proportions are part of the identity and remain exact at
  all scales and contexts.
- Single-line variant: `BONANZA CR8TIVES` with a 32-unit em space (one
  cap-width) between words. Same letterforms, no shrinking.

### Monogram — silhouette authority (refinement #2)

- Standalone B, single letter (not BC).
- **Lower bowl widened by +2 units beyond the wordmark spec** — for
  silhouette recognisability at distance (hat, chain, app-icon scales).
- Used in: app icon, favicon, hat, watermarks. Always solid, never outlined.

### Optical corrections (non-geometric lock)

- Round forms (O, B bowls, 8 bowls) are balanced by eye, not equal by
  measurement.
- Lower half of the wordmark carries +1–2% more visual weight to feel
  grounded.
- SVG is checked at 16 / 64 / 200 / 512 px before approval.

### Human signal (controlled imperfection)

- One controlled imperfection signals hand-origin: ≤1-unit variance.
- Located at the upper-bowl-to-stem junction of the B, where the inner curve
  is offset by 1 unit from geometric ideal — felt, not seen.

### Reproduction tests (= visual approval gate)

- 16 px favicon (B monogram only; serifs reduced to 4 units to survive
  sub-pixel rendering).
- 64 px app icon (B monogram, bz-pink on bz-white, optical centring 1 px
  above geometric).
- 200 px website header (full lockup, no compromises).
- 500 mm embroidery (hat — B monogram, single colour).

### Negative space rule

No internal counter collapses below 1.5 px at 16 px rendering. If it would,
the letterform simplifies; the SVG never scales blindly.

### SVG approach

- **Filled paths only.** Recolour via `fill` attribute (production SVGs use
  `currentColor` so the parent `color` recolours the mark).
- Files:
  - `/public/brand/wordmark.svg` — full BONANZA / CR8TIVES lockup.
  - `/public/brand/monogram.svg` — standalone B (widened lower bowl).
  - `/public/favicon.svg` — to be regenerated to carry the B monogram at
    the simplified-serif spec during the visual rebuild step.

## Spacing & layout

- 8-unit base grid. All spacing is a multiple of 8.
- Hero vertical rhythm: 80 / 24 / 32 / 56 / 24.
- Section borders: 1 px hairlines; never below 0.5 px.

## Motion

- Ease curve: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Signature underline draw: 600 ms.
- Maker's mark fade: 600 ms at +1000 ms delay.
- Voice-line fade: 600 ms at +2400 ms delay.
- `prefers-reduced-motion`: all three become static-rendered.

## A11y

- All interactive elements: 4.5:1 contrast minimum.
- bz-pink only ever on bz-white as accent type at ≥18 px, or as a surface.
- Keyboard focus rings: 2 px bz-ink outline, 2 px offset.
- `prefers-reduced-motion` respected throughout.

## Anti-patterns (do not ship)

- bz-pink body copy.
- Cormorant italic anywhere.
- Two-section pink runs (pink dominates exactly one section: the hero).
- Auto-tracking the wordmark.
- Dark-mode toggle.
- Drop shadows on the wordmark or monogram.
- Gradients **on the wordmark or monogram themselves**. (Surface
  ambience like a localised radial glow behind a hero or CTA is
  permitted as a *surface treatment*, not part of the identity mark.)

## Files in scope for the visual rebuild step

- `artifacts/open-design/public/brand/wordmark.svg`
- `artifacts/open-design/public/brand/monogram.svg`
- `artifacts/open-design/public/favicon.svg` (regenerate)
- `artifacts/open-design/index.html` (font link, theme-color, mask-icon)
- `artifacts/open-design/src/components/BonanzaLanding.{tsx,css}`
- `artifacts/open-design/src/components/BonanzaStudio.{tsx,css}`
- 404 surface — to be confirmed during rebuild (may be inline in router; no
  `BonanzaNotFound.tsx` exists yet).
- `system/huashu.md` — reduced to pointer back to this file.
- `system/brain.md` — references DESIGN.md as primary identity source.

## Hold gate

The SVG wordmark + monogram are reviewed in chat before any visual rebuild
proceeds. Five validation layers must pass:

1. Optical corrections at 16 / 64 / 512 px.
2. One controlled human imperfection if the mark feels too perfect.
3. Reproduction test across favicon, app icon, header, and embroidery scale.
4. Negative-space integrity at small sizes.
5. bz-pink behaviour across white, black, and OLED-like conditions.
