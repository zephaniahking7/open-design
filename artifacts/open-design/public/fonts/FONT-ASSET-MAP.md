# Font + Icon Asset Map

Central reference for website-ready fonts and icon fonts.
Last updated: production-ready batch copy (10 families added).

## Source Repos

Source repos are cloned into:

/repos/

Current source repos (status from live audit):

- /repos/gabarito                READY      5.8 MB   7 WOFF2 + OFL.txt
- /repos/frick                   PREVIEW    864 KB   2 WOFF2 + 2 WOFF + 2 OTF + OFL.txt (template unfilled)
- /repos/petrona                 NEEDS-CONV 283 MB   0 WOFF2 (TTF/OTF only) + OFL.txt
- /repos/whois-mono              LICENCE-?  7.8 MB   0 WOFF2; only 1 WOFF + 1 TTF; OFL declared in README only
- /repos/saira                   READY      43 MB    127 WOFF2 + OFL.txt
- /repos/material-design-icons   ABSENT     0 bytes  directory exists but empty (working tree wiped)

## Source ZIP Packs

Uploaded ZIPs sit in:

/artifacts/open-design/public/fonts/incoming-zips/

Extracted (Python zipfile, not unzip — `unzip` not in env) into:

/artifacts/open-design/public/fonts/incoming-extracted/

28 packs extracted total. Audit complete. 10 production-ready, 9 preview-only, 9 hold.

## Live Website Font Folders

Only approved, licensed, production-ready font files are copied into:

/artifacts/open-design/public/fonts/

Current live folders:

- /public/fonts/plus-jakarta-sans/      LIVE — currently serving the landing
- /public/fonts/custom/gabarito/        POPULATED (production-ready, not yet wired)
- /public/fonts/custom/saira/           POPULATED (production-ready, not yet wired)
- /public/fonts/custom/frick/           POPULATED (preview-only, do not wire to live)
- /public/fonts/custom/climate-crisis/  POPULATED (production-ready, not yet wired)
- /public/fonts/custom/absans/          POPULATED (production-ready, not yet wired)
- /public/fonts/custom/apfel-grotezk/   POPULATED (production-ready, not yet wired)
- /public/fonts/custom/aujournuit/      POPULATED (production-ready, not yet wired)
- /public/fonts/custom/coconat/         POPULATED (production-ready, not yet wired)
- /public/fonts/custom/halibut/         POPULATED (production-ready, not yet wired)
- /public/fonts/custom/mazius-display/  POPULATED (production-ready, not yet wired)
- /public/fonts/custom/ronzino/         POPULATED (production-ready, not yet wired)
- /public/fonts/custom/sinistre/        POPULATED (production-ready, not yet wired)
- /public/fonts/custom/sprat/           POPULATED (production-ready, not yet wired)
- /public/fonts/custom/petrona/         empty — hold for WOFF2 conversion
- /public/fonts/custom/whois-mono/      empty — hold for licence file + WOFF2
- /public/fonts/icons/material-symbols/ empty — hold; lucide-react remains primary

## Rules

- Do not use fonts directly from /repos or /incoming-extracted in the live app.
- Do not copy a font into /public/fonts/custom unless its licence file is present and commercial web use appears allowed.
- Prefer WOFF2.
- If only TTF/OTF exists, mark preview-only and convert before promoting.
- Keep licence file beside served font files.
- Use font-display: swap in @font-face.
- Keep fallback stack:
  system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.
- Do not replace the live Bonanza site font until approved.

## Current Confirmed Live Font

Plus Jakarta Sans (UNCHANGED — still the live landing font):
- /public/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2
- /public/fonts/plus-jakarta-sans/OFL.txt

## Custom Fonts — Status Table (13 populated families)

| Family            | Status               | Files in /public/fonts/custom/<folder>/                                          | Licence file     | Picker role           |
|-------------------|----------------------|---------------------------------------------------------------------------------|------------------|-----------------------|
| Gabarito          | PRODUCTION-READY     | gabarito/Gabarito[wght].woff2                                                   | OFL.txt          | Clean Modern          |
| Saira             | PRODUCTION-READY     | saira/Saira-Regular.woff2, Saira-Bold.woff2, Saira-Black.woff2                  | OFL.txt          | Street Culture        |
| Climate Crisis    | PRODUCTION-READY     | climate-crisis/ClimateCrisis-Variable.woff2                                     | License.txt      | Cinematic Drama       |
| Absans            | PRODUCTION-READY     | absans/Absans-Regular.woff2                                                     | LICENSE.txt      | Clean Modern          |
| Apfel Grotezk     | PRODUCTION-READY     | apfel-grotezk/ApfelGrotezk-Regular.woff2, -Mittel.woff2, -Fett.woff2            | LICENSE.txt      | Clean Modern          |
| Aujournuit        | PRODUCTION-READY     | aujournuit/Aujournuit-VariableVF.woff2                                          | LICENSE.txt      | Editorial Luxury      |
| Coconat           | PRODUCTION-READY     | coconat/Coconat-Regular.woff2, Coconat-Demi.woff2, Coconat-Bold.woff2           | LICENSE.txt      | Editorial Luxury      |
| Halibut           | PRODUCTION-READY     | halibut/Halibut-CondensedRegular.woff2, Halibut-ExpandedRegular.woff2           | LICENSE.txt      | Tech Future           |
| Mazius Display    | PRODUCTION-READY     | mazius-display/MaziusDisplay-Regular.woff2, MaziusDisplay-Bold.woff2            | LICENSE.txt      | Editorial Luxury      |
| Ronzino           | PRODUCTION-READY     | ronzino/Ronzino-Medium.woff2, Ronzino-Bold.woff2                                | LICENSE.txt      | Bold Impact           |
| Sinistre          | PRODUCTION-READY     | sinistre/SinistreVF.woff2                                                       | LICENSE.txt      | Cinematic Drama       |
| Sprat             | PRODUCTION-READY     | sprat/Sprat-Bold.woff2, Sprat-CondensedBold.woff2, Sprat-ExtendedBlack.woff2    | LICENSE.txt      | Editorial Luxury      |
| Frick             | PREVIEW-ONLY         | frick/Frick0.3-Regular.woff2, Frick0.3-Condensed.woff2                          | OFL.txt (blank)  | Bold Impact           |

Note on Sprat: the inspection report listed `Sprat-ExtraExpandedBlack.woff2` but the actual repo only ships an `Extended` axis (no `ExtraExpanded` variant). Substituted `Sprat-ExtendedBlack.woff2` as the third weight — same family, valid OFL, 24 KB.

## Preview-only Fonts (waiting for WOFF2 conversion)

OFL clean, only TTF/OTF available — nothing copied yet:

- LT Avocado     (TTF)  Soft Premium
- LT Beverage    (OTF)  Bold Impact
- LT Crow        (TTF)  Classic Trust
- LT Delilah     (TTF)  Feminine Elegant
- LT Humor       (TTF)  Youthful Fun
- LT Makeup      (OTF)  Feminine Elegant
- LT Oval        (OTF)  Soft Premium
- LT Railway     (OTF)  Tech Future
- LT Renovate    (OTF)  Bold Impact
- Petrona        (TTF)  Editorial Luxury / Classic Trust

Action: convert with fonttools then promote.

## Hold Fonts (no licence file in pack)

Letters Type packs that shipped without OFL.txt — do not copy:

- LT Crewmate (BETA)
- LT Diary
- LT Hoop
- LT Indoor
- LT Showcase
- LT Skyscraper
- LT Smudge
- LT Sonoma
- LT Soul
- Whois Mono       (OFL declared in README only — needs proper OFL.txt + WOFF2)

Action: re-download from a release that includes licence files, or contact the foundry.

## Material Symbols  🔴 HOLD

- Local clone empty
- Apache 2.0 (per upstream)
- lucide-react remains primary icon system
- When approved: fetch only `MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].woff2` from a CDN

## Client Font Picker Direction

Suggested role coverage (which production-ready families satisfy each role):

- Clean Modern        ← Gabarito, Absans, Apfel Grotezk
- Editorial Luxury    ← Coconat, Mazius Display, Aujournuit, Sprat   (Petrona pending)
- Bold Impact         ← Ronzino   (Frick preview)
- Soft Premium        ← (LT Avocado / LT Oval pending conversion)
- Street Culture      ← Saira
- Tech Future         ← Halibut   (Whois Mono pending licence + WOFF2)
- Youthful Fun        ← (LT Humor pending conversion)
- Feminine Elegant    ← (LT Delilah / LT Makeup pending conversion)
- Classic Trust       ← (LT Crow pending conversion; Petrona pending)
- Cinematic Drama     ← Sinistre, Climate Crisis
- Minimal Calm        ← (no live candidate yet)
- Heritage Artisan    ← (no live candidate yet)

UI copy:
"Choose the direction you naturally connect with. Bonanza Cr8tives will refine the final font pairing for readability, mobile performance and brand fit."

## Website Path Usage

Files inside /public are referenced without "public".

Examples:

/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2   (LIVE)
/fonts/custom/coconat/Coconat-Regular.woff2                         (READY, not wired)
/fonts/custom/sinistre/SinistreVF.woff2                             (READY, not wired)
/fonts/custom/frick/Frick0.3-Regular.woff2                          (PREVIEW, not wired)

## Wiring Recipe (for future approved swap)

When the client signs off on a candidate font role, wiring is small and isolated:

1. Add an @font-face in BonanzaLanding.css with `font-display: swap` and the fallback stack
2. Map the font behind a CSS variable (e.g. `--font-display`) so the role is swappable
3. Re-run mobile screenshots at 375 / 768 / 1024 / 1440 to confirm no layout shift
4. Confirm landing weight: served WOFF2 should add ≤ ~80 KB total to the page

No backend, no API, no /studio change required.
