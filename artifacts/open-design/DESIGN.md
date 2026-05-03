# Bonanza Cr8tives — Identity System (Stage 5, current)

Single source of truth for the Bonanza Cr8tives launch landing visual
language. This file supersedes prior Stage 3 pink/teal/yellow rules in
their entirety. Pink is **deprecated** from the public landing identity.

> **Reviewer note — do not validate the launch landing against the
> obsolete Stage 3 pink/teal/yellow brief.** That direction was
> ratified, then deliberately superseded by Stage 4 (palette pivot)
> and Stage 5 (typography pivot). Any code review or audit that
> references bz-pink, bz-teal, bz-yellow, Cormorant, Satoshi, or the
> custom hand-lettered "Brixton Hand" wordmark as required is reading
> outdated rules. Use this document as the only source of truth.

## Stage history (most recent first)

### Stage 5 — Typography pivot (current)

- **Satoshi → Plus Jakarta Sans.** Self-hosted variable WOFF2
  (`/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2`,
  60 KB, axis 200–800). `font-display: swap`. Preloaded in
  `index.html`. All Fontshare CDN references removed — zero external
  font requests at runtime.
- **Wordmark is now launch-safe text-set typography**, not the
  earlier custom "Brixton Hand" hand-lettered SVG path system. Both
  `Wordmark.tsx` and the seven brand SVGs in `public/brand/` use
  `<text>` elements with the Plus Jakarta Sans family. The custom
  geometric wordmark direction is deferred — text-set is the shipped
  identity for launch.
- **Fallback stack** (locked):
  `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.

### Stage 4 — Palette pivot

- **Pink-dominant → Blue/Sky/Aqua/Mist + Purple accent.** The original
  bz-pink (#FF2E88) / bz-teal (#00B5A1) / bz-yellow (#FFD400) tokens
  are removed from the landing surface. Pink is no longer part of the
  public identity.
- **Two-tone surface rhythm** (≈70/20/10): bz-black dominant for
  Header / Hero / VisionInput / CreativeOrbit / FinalCTA / Footer;
  Soft Mist for WhatWeBuild / BeforeAfter / Packages; Sky Blue for
  Connect.

### Stage 3 — Identity rebuild *(superseded — historical only)*

The Stage 3 pink/teal/yellow direction with the custom Brixton Hand
wordmark was ratified, partially shipped, then explicitly retired by
the user before launch. It is preserved here as history only and must
not be used to grade the current landing.

## Authority order

1. **This file** (`artifacts/open-design/DESIGN.md`) — current rules.
2. **Live tokens** in `BonanzaLanding.css` `:root` block — the
   implementation truth.
3. `system/huashu.md` — critique methodology applied AFTER
   implementation; not a definition.

## Surface decision (no dark-mode toggle)

The landing commits to a single surface system. `prefers-color-scheme`
is detected only to ensure the OS preference does not force unintended
inversion. The page stays in its designed surface. This is intentional
brand discipline, not a missing feature.

## Palette (current — Stage 4)

| Token (CSS var)        | Hex      | Role                                                                           |
|------------------------|----------|--------------------------------------------------------------------------------|
| `--bz-accent`          | #5680E9  | Primary Blue. Primary CTA fill, focus rings, signature accents.                |
| `--bz-accent-strong`   | #8860D0  | Purple. Premium hover/active state. Identity-defining secondary.               |
| `--bz-aqua`            | #5AB9EA  | Aqua Blue. Energetic support accent — micro-rules, decorative spots.           |
| `--bz-sky`             | #84CEEB  | Sky Blue. Light support surface (Connect section dominant).                    |
| `--bz-mist`            | #C1C8E4  | Soft Mist. Muted soft surface (WhatWeBuild / BeforeAfter / Packages dominant). |
| `--bz-black`           | #0B0B0B  | Dominant surface for Header / Hero / VisionInput / CreativeOrbit / FinalCTA / Footer. |
| `--bz-elev`            | (var)    | Elevated dark surface for cards on bz-black.                                   |
| `--bz-text` / soft / mute | white-tier | Body / soft / muted type colours on dark surfaces.                          |
| `--bz-ink*` family     | dark-tier | Body / soft / muted type colours on Mist + Sky surfaces (AA/AAA verified).     |

Deprecated tokens (must not appear in any landing component):
`bz-pink`, `bz-teal`, `bz-yellow`, `bz-paper`.

## Section dominance (page rhythm — current)

| Section          | Surface               | Type colour family | Accent role                          |
|------------------|-----------------------|--------------------|--------------------------------------|
| Header           | bz-black              | white-tier         | Primary Blue on Studio CTA          |
| Hero             | bz-black              | white-tier         | Primary Blue radial glow + CTA       |
| Vision Intake    | bz-black              | white-tier         | Primary Blue focus ring on input    |
| What We Build    | Soft Mist (`.bz-section--light`) | bz-ink-tier | Primary Blue hover top-rule on cards |
| Cr8tive Orbit    | bz-black / bz-elev    | white-tier         | Primary Blue step numerals           |
| Before / After   | Soft Mist             | bz-ink-tier        | Aqua "after" markers                 |
| Packages         | Soft Mist             | bz-ink-tier        | Purple border on featured tier       |
| Final CTA        | bz-black              | white-tier         | Primary Blue radial glow under CTA   |
| Connect          | Sky Blue (`.bz-section--sky`) | bz-ink-tier | Primary Blue hover arrow on socials  |
| Footer           | bz-black              | white-tier         | Primary Blue "Currently —" dot       |

One dominant colour per section. The `.bz-section--light` and
`.bz-section--sky` modifier classes carry the contrast overrides for
their respective light surfaces.

## Type system (current — Stage 5)

- **Family:** Plus Jakarta Sans (Tokotype, SIL OFL).
- **Distribution:** self-hosted variable WOFF2 from
  `/fonts/plus-jakarta-sans/`. Single 60 KB file. No CDN.
- **Loading:** `@font-face` at the top of `BonanzaLanding.css` with
  `format('woff2-variations')`, `font-weight: 200 800`,
  `font-display: swap`. Preloaded via `<link rel="preload" as="font"
  type="font/woff2" crossorigin>` in `index.html`.
- **Fallback stack** (locked, never edit):
  `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.

### Weight roles

| Role                          | Weight | Selector(s)                                          |
|-------------------------------|--------|------------------------------------------------------|
| Wordmark                      | 800 ExtraBold | `Wordmark.tsx` SVGs + 7 brand SVGs            |
| Hero headline                 | 800 ExtraBold | `.bz-hero-title`                              |
| Section headings              | 700 Bold      | `.bz-section-title`, `.bz-pkg-name`, `.bz-orbit-title` |
| Final CTA title               | 800 ExtraBold | `.bz-final-title`                             |
| Package price                 | 800 ExtraBold | `.bz-pkg-price`                               |
| CTAs / buttons                | 600 SemiBold  | `.bz-cta`                                     |
| Body copy                     | 400 Regular   | `.bz-hero-sub`, `.bz-section-lede`, etc.      |
| Eyebrows / labels / nav       | 500 Medium    | `.bz-section-eyebrow`, `.bz-hero-eyebrow`, etc. |

Banned families (must not appear in landing code):
Satoshi, Cormorant Garamond, Instrument Sans/Serif, Söhne, Inter.

## Wordmark — launch-safe text-set typography

The wordmark is set in Plus Jakarta Sans 800 inside an inline SVG, not
drawn as a custom hand-lettered path system. Single source of truth:
`src/components/Wordmark.tsx`. All consumers (Header, Footer,
VisionInput maker's mark, 404 surface) inherit automatically.

- Two-line lockup: `BONANZA` / `CR8TIVES`, 56 px each, letter-spacing 1.5.
- Monogram: standalone `B`, 56 px in a 64×64 viewBox, optically centred.
- `currentColor` fill — the mark inherits its colour from the parent.
- `preserveAspectRatio="xMinYMid meet"` for the wordmark (left-aligns
  inside the consumer's box); `xMidYMid meet` for the monogram.
- Brand SVGs in `public/brand/` (wordmark, monogram, three preview-
  wordmark-on-* tiles, two preview-monogram-* tiles) all use the same
  text-set approach with the same FONT_STACK and weight.

The earlier custom "Brixton Hand" geometric wordmark (cap height 100,
wedge serifs, held-bar 8, ±1-unit human imperfection, etc.) is
deferred. If it ever returns, it would replace the text-set mark in a
single coordinated change inside `Wordmark.tsx` + the brand SVGs.

## Spacing & layout

- 8-unit base grid. All spacing is a multiple of 8.
- Hero vertical rhythm: 80 / 24 / 32 / 56 / 24.
- Section borders: 1 px hairlines; never below 0.5 px.

## Motion (Stage 3 grammar — preserved)

Hero entrance is **load-in only** — no cursor tracking, no WebGL, no
shader libraries, no JS-driven animation:

- **Stagger:** eyebrow 80 ms → title 200 ms → sub 380 ms → CTAs 520 ms.
- **Per-block:** 700 ms duration, `cubic-bezier(0.16, 1, 0.3, 1)`,
  fade in + 12 px rise.
- **Glow drift:** 18 s slow alternate translate (≤1.5 %) + scale (≤1.04).
- **Reduced motion:** all hero animations inert; copy at final
  position, glow does not drift.

VisionInput render theatre is **CSS-only refinement** of existing
state — render and lead JS logic untouched. Composing dots, signature
halo, and proscenium rule now use Primary Blue tokens (was bz-pink).

## A11y

- All interactive elements: 4.5:1 contrast minimum.
- Bz-ink token family on Soft Mist and Sky Blue surfaces verified
  AA/AAA across body, soft, and muted weights.
- Keyboard focus rings: 2 px Primary Blue outline, 2 px offset.
- `prefers-reduced-motion` respected throughout.

## Anti-patterns (do not ship)

- **Pink anywhere on the public landing.** Deprecated.
- Cormorant italic anywhere.
- Satoshi or Fontshare CDN references — removed and must not return.
- Two competing dominant colours in one section.
- Auto-tracking the wordmark or scaling its glyphs non-uniformly.
- Dark-mode toggle.
- Drop shadows on the wordmark or monogram.
- Gradients on the wordmark or monogram themselves (surface-level
  radial glow behind a hero or CTA is permitted as ambience, not as
  part of the mark).

## Out of scope (deferred)

- **`/studio` restyle.** The IDE surface remains on its existing
  palette and type until a dedicated follow-up. Do not migrate
  `BonanzaStudio.{tsx,css}` as part of any landing-scoped task.
- **Legacy IDE TypeScript errors.** Pre-existing in the IDE surface
  and not introduced by Stage 4 / Stage 5 work. Out of scope for
  landing identity tasks.
- **Custom geometric wordmark.** Deferred indefinitely; text-set is
  the shipped identity for launch.

## Files in scope for landing identity work

- `artifacts/open-design/index.html` (font preload, theme-color, mask-icon)
- `artifacts/open-design/src/components/BonanzaLanding.{tsx,css}`
- `artifacts/open-design/src/components/landing/*.tsx` (all sections)
- `artifacts/open-design/src/components/Wordmark.tsx`
- `artifacts/open-design/public/brand/*.svg` (7 SVGs)
- `artifacts/open-design/public/favicon.svg`
- `artifacts/open-design/public/fonts/plus-jakarta-sans/*` (font assets)

Files explicitly **out of scope** for landing identity work:
backend (`artifacts/api-server/**`), database, `/studio`
(`BonanzaStudio.{tsx,css}` and the `studio/` subtree), render flow
(`/api/render` SSE pipeline, `useRenderStream`), lead capture
(`/api/leads`, `LeadCaptureModal`, validation), API routes, rate
limiting, error tracking, workflows, package dependencies.

## Hold gate

Before any landing visual change ships:

1. Verified at desktop 1280 and mobile 402.
2. Contrast checked on both Mist and Sky surfaces (AA min, AAA where reachable).
3. No external font requests at runtime.
4. Render flow and lead capture untouched (zero edits in those paths).
5. `/studio` untouched.
