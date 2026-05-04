# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is the "Open Design" project — a local-first AI design tool that lets you run design generation agents (Claude, Codex, etc.) from the browser.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **`artifacts/open-design/`** — Main React + Vite web app (ported from Next.js). Full SPA with custom pushState router. Talks to the local daemon at `/api/*` or directly to Anthropic/OpenAI APIs in BYOK mode.
- **`artifacts/api-server/`** — Express API server backend (shared scaffold).
- **`artifacts/mockup-sandbox/`** — Design/mockup sandbox.

## Key Files

- `artifacts/open-design/src/App.tsx` — Root component (EntryView + ProjectView + SettingsDialog)
- `artifacts/open-design/src/router.ts` — Custom pushState router (no React Router/wouter)
- `artifacts/open-design/src/contracts/` — Inlined copy of `@open-design/contracts` package (types + API shapes)
- `artifacts/open-design/src/state/config.ts` — AppConfig: API key, model, daemon mode, theme
- `artifacts/open-design/src/state/projects.ts` — Project/conversation CRUD (REST to daemon)
- `artifacts/open-design/src/providers/` — Anthropic SDK, OpenAI-compatible, daemon SSE streaming
- `artifacts/open-design/src/components/` — All UI: EntryView, ProjectView, ChatPane, FileViewer, SettingsDialog, etc.
- `artifacts/open-design/src/i18n/` — i18n with 11 locales

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Bonanza Cr8tives Landing

The public landing (`/`) is a custom-built marketing page for Bonanza Cr8tives. Key landing components live in `artifacts/open-design/src/components/landing/`. All styles are in `BonanzaLanding.css` using `bz-` prefixed selectors isolated from the main app.

**IA spine** (locked Stage 4): Hero → VisionInput → Ecosystem → WhatWeBuild → ThemePicker → FontPicker → Packages → CreativeOrbit → BeforeAfter → FinalCTA → Connect → Footer.

**ThemePicker** (`ThemePicker.tsx`): Client Visual Direction Picker — 20 theme previews from `/brand-assets/theme-previews/`, heart/favourite (max 3), "Help me choose" (theme #13), "View all directions" expand, large hero preview. Selection stored via module-level `getThemeSelection()` and integrated into VisionInput's `compileVision()` build brief.

**FontPicker** (`FontPicker.tsx`): Font Personality Picker — 12 production-ready font direction cards (Plus Jakarta Sans, Gabarito, Saira, Apfel Grotezk, Coconat, Mazius Display, Ronzino, Halibut, Sinistre, Aujournuit, Sprat, Climate Crisis). Each card shows headline + paragraph sample rendered in that font, "Best for" tag, production-ready badge, choose primary/backup buttons. "Recommend for me" clears selections and delegates to Bonanza. @font-face rules loaded via component-scoped `<style>` tag only when section enters viewport (IntersectionObserver with 200px rootMargin). Selection stored via module-level `getFontSelection()` returning `{ primary, backup, recommendForMe }`, integrated into VisionInput's `compileVision()` build brief. All fonts from `/public/fonts/custom/` WOFF2 files with `font-display: swap`. No global font loading. No hold/preview-only fonts used (Frick excluded).

**Brand assets**: 20 logos in `/public/brand-assets/logos/` (all ecosystem logos now RGBA with transparent backgrounds), 20 theme previews in `/public/brand-assets/theme-previews/`. Asset inventory tracked in `ASSET-MAP.md`.

**Design tokens**: Two-tone blue palette (`--bz-accent` #5680E9, `--bz-accent-strong` #8860D0, `--bz-aqua`, `--bz-sky`, `--bz-mist`). Plus Jakarta Sans variable WOFF2. All motion gated by `prefers-reduced-motion`.

**Do-not-touch**: backend, DB, /studio, /api/render SSE, /api/leads, rate limiting, error tracking, workflows, package.json, legacy IDE files, routes, payment logic.

## Migration Notes

Ported from Next.js (Vercel import) to Vite + React:
- Original app: `apps/web` in monorepo, Next.js with static export + catch-all route
- Conversion: SPA shell → Vite, custom router preserved unchanged, `@open-design/contracts` inlined as `src/contracts/`, `@anthropic-ai/sdk` installed for browser BYOK usage
- No `next/image`, `next/link`, or SSR patterns were used in the original (already a pure SPA)
- The daemon backend (local Express CLI) is NOT included in this Replit deployment — the app runs in API/BYOK mode against Anthropic or OpenAI-compatible providers
