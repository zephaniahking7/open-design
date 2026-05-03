# Font + Icon Asset Map

Central reference for website-ready fonts and icon fonts.
Last updated: approved first-batch font copy.

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

## Live Website Font Folders

Only approved, licensed, production-ready font files are copied into:

/artifacts/open-design/public/fonts/

Current live folders:

- /public/fonts/plus-jakarta-sans/      LIVE — currently serving the landing
- /public/fonts/custom/gabarito/        POPULATED (production-ready, not yet wired)
- /public/fonts/custom/frick/           POPULATED (preview-only, do not wire to live)
- /public/fonts/custom/petrona/         empty — hold for WOFF2 conversion
- /public/fonts/custom/whois-mono/      empty — hold for licence file + WOFF2
- /public/fonts/custom/saira/           POPULATED (production-ready, not yet wired)
- /public/fonts/icons/material-symbols/ empty — hold; lucide-react remains primary

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

Plus Jakarta Sans (UNCHANGED — still the live landing font):
- /public/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2
- /public/fonts/plus-jakarta-sans/OFL.txt

## Custom Fonts — Status Table

| Font          | Status                  | Files in /public/fonts/                                    | Licence in /public/fonts/ |
|---------------|-------------------------|------------------------------------------------------------|---------------------------|
| Gabarito      | PRODUCTION-READY        | custom/gabarito/Gabarito[wght].woff2                       | custom/gabarito/OFL.txt   |
| Saira         | PRODUCTION-READY        | custom/saira/Saira-Regular.woff2, Saira-Bold.woff2, Saira-Black.woff2 | custom/saira/OFL.txt      |
| Frick         | PREVIEW-ONLY            | custom/frick/Frick0.3-Regular.woff2, Frick0.3-Condensed.woff2 | custom/frick/OFL.txt   |
| Petrona       | HOLD — WOFF2 conversion | (none)                                                     | (none)                    |
| Whois Mono    | HOLD — licence + WOFF2  | (none)                                                     | (none)                    |
| Material Symbols | HOLD — lucide remains primary | (none)                                              | (none)                    |

## Per-font Detail

### Gabarito  ✅ PRODUCTION-READY
- Role: Clean Modern / Friendly Tech
- Picker label: **Clean Modern**
- Licence: SIL Open Font License v1.1 (Copyright 2023 The Gabarito Project Authors)
- Commercial web use: yes
- Served file: `/fonts/custom/gabarito/Gabarito[wght].woff2` (single variable file, all weights 400–900)
- Licence file: `/fonts/custom/gabarito/OFL.txt`
- Wiring status: NOT wired into live CSS yet (awaiting approval)

### Saira  ✅ PRODUCTION-READY
- Role: Strong Modern / Urban Tech / Versatile
- Picker label: **Street Culture** (alt: Bold Impact)
- Licence: SIL Open Font License v1.1 (Copyright 2020 The Saira Project Authors)
- Commercial web use: yes
- Served files (3-weight subset, kept small):
  - `/fonts/custom/saira/Saira-Regular.woff2`
  - `/fonts/custom/saira/Saira-Bold.woff2`
  - `/fonts/custom/saira/Saira-Black.woff2`
- Licence file: `/fonts/custom/saira/OFL.txt`
- Wiring status: NOT wired into live CSS yet (awaiting approval)

### Frick  ⚠️ PREVIEW-ONLY
- Role: Bold Impact / Expressive
- Picker label: **Bold Impact**
- Licence: SIL Open Font License v1.1 — **template fields unfilled** (`<dates>`, `<Copyright Holder>`, `<URL|email>`, `<Reserved Font Name>` blank in `OFL.txt`)
- Commercial web use: most likely allowed (OFL boilerplate intent) but the lack of an identified copyright holder is a hygiene concern
- Served files (preview-only — do not deploy live until verified):
  - `/fonts/custom/frick/Frick0.3-Regular.woff2`
  - `/fonts/custom/frick/Frick0.3-Condensed.woff2`
- Licence file: `/fonts/custom/frick/OFL.txt`
- **Action required before promoting to production-ready:** confirm licence-holder details with the original author and obtain a properly filled OFL.txt
- Wiring status: NOT wired into live CSS — preview only

### Petrona  🔴 HOLD
- Role: Editorial / Classic Trust
- Status: HOLD — needs WOFF2 conversion (only TTF/OTF in repo)
- Licence: SIL OFL v1.1 — clean
- Action: convert `repos/petrona/Fonts/ttf-variable/Petrona[wght].ttf` to WOFF2 before any copy

### Whois Mono  🔴 HOLD
- Role: Tech Future / System / Code Feel
- Status: HOLD — no `OFL.txt` file in repo (only README mentions OFL); no WOFF2
- Action: obtain proper OFL.txt from upstream + convert TTF to WOFF2

### Material Symbols  🔴 HOLD
- Status: HOLD — local clone is empty; lucide-react remains primary icon system
- Action when approved: fetch only `MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].woff2` from a CDN rather than re-cloning the multi-GB repo

## Client Font Picker Direction

The font picker should show font mood/direction, not hand final creative control to the client.

Suggested roles:

- Clean Modern        ← Gabarito ready
- Editorial Luxury    ← Petrona pending
- Bold Impact         ← Frick (preview) ready
- Soft Premium
- Street Culture      ← Saira ready
- Tech Future         ← Whois Mono pending
- Youthful Fun
- Feminine Elegant
- Classic Trust       ← Petrona pending
- Cinematic Drama
- Minimal Calm
- Heritage Artisan

The UI should say:
"Choose the direction you naturally connect with. Bonanza Cr8tives will refine the final font pairing for readability, mobile performance and brand fit."

## Website Path Usage

Files inside /public are referenced without "public".

Examples:

/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2   (LIVE)
/fonts/custom/gabarito/Gabarito[wght].woff2                         (READY, not wired)
/fonts/custom/saira/Saira-Regular.woff2                             (READY, not wired)
/fonts/custom/frick/Frick0.3-Regular.woff2                          (PREVIEW, not wired)

## Wiring Recipe (for future approved swap)

When the client signs off on a candidate font role, wiring is small and isolated:

1. Add an @font-face in BonanzaLanding.css with `font-display: swap` and the fallback stack
2. Map the font behind a CSS variable (e.g. `--font-display`) so the role is swappable
3. Re-run mobile screenshots at 375 / 768 / 1024 / 1440 to confirm no layout shift
4. Confirm landing weight: served WOFF2 should add ≤ ~80 KB total to the page

No backend, no API, no /studio change required.
