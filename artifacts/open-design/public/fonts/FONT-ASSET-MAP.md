# Font + Icon Asset Map

Central reference for website-ready fonts and icon fonts.
Last audited: stage 6 prep.

## Source Repos

Source repos are cloned into:

/repos/

Current source repos (status from live audit):

- /repos/gabarito                READY      11 MB    7 WOFF2 + OFL.txt
- /repos/frick                   READY      1.3 MB   2 WOFF2 + 2 WOFF + 2 OTF + OFL.txt
- /repos/petrona                 NEEDS-CONV 491 MB   0 WOFF2 (TTF/OTF only) + OFL.txt
- /repos/whois-mono              LICENCE-?  14 MB    0 WOFF2, 1 WOFF + 1 TTF, NO OFL/LICENSE file present
- /repos/saira                   READY      66 MB    127 WOFF2 + OFL.txt (full static + condensed family)
- /repos/material-design-icons   PARTIAL    125 MB   sparse-clone interrupted; .git only, no working tree

## Live Website Font Folders

Only approved, licensed, production-ready font files should be copied into:

/artifacts/open-design/public/fonts/

Current live folders (created, mostly empty awaiting approval):

- /public/fonts/plus-jakarta-sans/      LIVE — single variable WOFF2 + OFL.txt
- /public/fonts/custom/gabarito/        empty — ready to populate
- /public/fonts/custom/frick/           empty — ready to populate
- /public/fonts/custom/petrona/         empty — needs WOFF2 conversion before populate
- /public/fonts/custom/whois-mono/      empty — BLOCKED on licence verification
- /public/fonts/custom/saira/           empty — ready to populate
- /public/fonts/icons/material-symbols/ empty — Material Symbols clone needs completing first

## Rules

- Do not use fonts directly from /repos in the live app.
- Do not copy a font into /public/fonts unless its licence is present and commercial web use appears allowed.
- Prefer WOFF2.
- If only TTF/OTF exists, report performance impact before using.
- Keep licence files beside the served font files where possible.
- Use font-display: swap in @font-face.
- Keep fallback stack:
  system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.
- Do not replace the live Bonanza site font until approved.
- The client font picker may preview fonts after they are copied and mapped.

## Current Confirmed Live Font

Plus Jakarta Sans:
- /public/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2
- /public/fonts/plus-jakarta-sans/OFL.txt   (licence shipped beside font)

## Candidate Custom Fonts — Audited Status

### Gabarito  ✅ READY
- Role: Clean Modern / Friendly Tech
- Licence: OFL.txt present at repos/gabarito/OFL.txt
- Web assets: 7 static WOFF2 + 1 variable WOFF2 (`Gabarito[wght].woff2`)
- Recommend serving: `Gabarito[wght].woff2` (single variable file, all weights)
- Status: ready to copy into /public/fonts/custom/gabarito/ on approval

### Frick  ✅ READY
- Role: Bold Impact / Expressive
- Licence: OFL.txt present at repos/frick/OFL.txt
- Web assets: 2 WOFF2 (`Frick0.3-Regular.woff2`, `Frick0.3-Condensed.woff2`)
- Recommend serving: both for display headlines
- Status: ready to copy on approval

### Petrona  ⚠️ NEEDS CONVERSION
- Role: Editorial / Classic Trust
- Licence: OFL.txt present at repos/petrona/OFL.txt
- Web assets: 0 WOFF2; only TTF (20 files) + OTF (18 files) + 1 variable TTF (`Petrona[wght].ttf`)
- Performance impact if used as-is: variable TTF is ~500–800 KB uncompressed vs ~80–120 KB if converted to WOFF2 — **not acceptable for landing**
- Action required: convert `Petrona[wght].ttf` to WOFF2 before serving (e.g. `fonttools` or browser-based converter)
- Status: blocked on conversion

### Whois Mono  🔴 LICENCE UNVERIFIED
- Role: Tech Future / System / Code Feel
- Licence: **no OFL/LICENSE file in repo** — only README.md
- Web assets: webfonts/ folder contains `whois-mono.ttf` + `whois-mono.eot` + `whois-mono.svg` + `stylesheet.css`. No WOFF2.
- Action required: confirm licence (commercial web use) with author before any integration
- Status: BLOCKED on licence verification

### Saira  ✅ READY
- Role: Strong Modern / Urban Tech / Versatile
- Licence: OFL.txt present at repos/saira/OFL.txt
- Web assets: 127 WOFF2 (full Saira family + Condensed + Expanded + Italic)
- Variable available: `Saira/fonts/variable/Saira[wdth,wght].ttf` + `Saira-Italic[wdth,wght].ttf` (TTF only, ~500 KB each — needs WOFF2 conversion if variable preferred)
- Recommend serving: minimal subset of static WOFF2 (e.g. Regular + Bold + Black) to keep footprint small, OR convert the variable TTF to WOFF2
- Status: ready to copy on approval

## Material Symbols

- Source: repos/material-design-icons (Apache 2.0)
- Clone state: **PARTIAL** — sparse-clone of `variablefont/` + `LICENSE` was interrupted by command timeout. .git is intact (~125 MB) but no working tree was checked out.
- To complete: run a follow-up shallow + sparse clone with longer timeout, or use the per-icon CDN at `https://fonts.gstatic.com/s/materialsymbolsoutlined/...` instead of self-hosting.
- Per asset-map rules: "Do not integrate Material Symbols until approved" — so this partial state is not blocking the launch.

Material Symbols should be treated as icon fonts, not brand typography.

Priority:
1. Keep lucide-react as default icon system.
2. Use Material Symbols only if specific icon/font effects are needed.
3. Prefer Material Symbols Outlined if only one style is copied.
4. Do not integrate Material Symbols until approved.

## Client Font Picker Direction

The font picker should show font mood/direction, not hand final creative control to the client.

Suggested roles:

- Clean Modern
- Editorial Luxury
- Bold Impact
- Soft Premium
- Street Culture
- Tech Future
- Youthful Fun
- Feminine Elegant
- Classic Trust
- Cinematic Drama
- Minimal Calm
- Heritage Artisan

The UI should say:
"Choose the direction you naturally connect with. Bonanza Cr8tives will refine the final font pairing for readability, mobile performance and brand fit."

## Website Path Usage

Files inside /public are referenced without "public".

Example:

/fonts/custom/gabarito/Gabarito[wght].woff2
/fonts/icons/material-symbols/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].woff2

## Recommended Next Step (Stage 6 prep)

When the client signs off on a candidate font role, the copy step is small and isolated:

1. Copy the chosen WOFF2 + OFL.txt from /repos/<font>/ into /public/fonts/custom/<font>/
2. Add an @font-face in BonanzaLanding.css with `font-display: swap` and the fallback stack
3. Add a CSS variable (e.g. `--font-display`) so the font role is swappable
4. Re-run mobile screenshots at 375 / 768 / 1024 / 1440 to confirm no layout shift

No backend, no API, no /studio change required.
