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

## Migration Notes

Ported from Next.js (Vercel import) to Vite + React:
- Original app: `apps/web` in monorepo, Next.js with static export + catch-all route
- Conversion: SPA shell → Vite, custom router preserved unchanged, `@open-design/contracts` inlined as `src/contracts/`, `@anthropic-ai/sdk` installed for browser BYOK usage
- No `next/image`, `next/link`, or SSR patterns were used in the original (already a pure SPA)
- The daemon backend (local Express CLI) is NOT included in this Replit deployment — the app runs in API/BYOK mode against Anthropic or OpenAI-compatible providers
