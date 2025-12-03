## RSS Reader Antigravity — Copilot/AI Agent Quick Guide

Brief: Next.js 16 + React 19 offline-first RSS reader. Server does scraping/parsing; client is UI + IndexedDB.

- Quick commands (pnpm required):

  - Install & dev: `pnpm install` → `pnpm dev` (http://localhost:3000)

  ## Copilot / AI Agent Quick Guide — RSS Reader Antigravity

  Purpose: rapid context for coding agents — architecture, critical files, commands, and repo conventions.

  Quick commands

  - `pnpm install` — install deps (pnpm required)
  - `pnpm dev` — dev server (http://localhost:3000)
  - `pnpm build && pnpm start` — production
  - `pnpm lint` — linting
  - `pnpm dlx playwright install` && `pnpm dlx playwright test` — E2E

  Big picture (why it’s structured this way)

  - App Router Next.js 16 + React 19. Client = UI + IndexedDB; Server = API routes in `src/app/api/*` for all external fetches and Node-only libs.
  - Node-native modules (`sharp`, `jsdom`, `rss-parser`) run only on server routes to avoid client bundle issues and CORS.

  Critical files (read first)

  - `src/hooks/useFeeds.ts` — feed lifecycle, localStorage backup, `UserError` pattern, flow that calls `/api/rss`.
  - `src/lib/db.ts` — IndexedDB schema, helpers (addFeed/addArticle/getFromIndex), `DB_VERSION` and migrations.
  - `src/app/api/rss/route.ts` — RSS parsing proxy (`rss-parser`), feed discovery and normalization.
  - `src/app/api/scrape/route.ts` — scraping pipeline: Readability → Cheerio fallback → image optimization (`sharp`) → `sanitize-html`.
  - `src/lib/summarization*.ts` — summarization entrypoints, Chrome Summarizer vs Transformers.js worker.
  - `src/components/layout/AppShell.tsx` — sidebar, `DEFAULT_FEEDS`, theme entrypoints.

  Project-specific conventions

  - Package manager: ALWAYS use `pnpm` (see `.cursor/rules/00-package-manager.md`). Use `pnpm dlx` instead of `npx`.
  - DB-first: use `src/lib/db.ts` helpers for all persistence. Do not access IndexedDB directly.
  - Error handling: throw `UserError` for user-facing problems (log with `console.warn`), use `Error` + `console.error` for developer faults.
  - Activity tracking: use `ActivityStatusContext` / `useActivityStatus()` for long-running tasks (types: `fetching-rss`, `scraping`, `translating`).

  Scraping & summarization rules (exact)

  - Scraper order: Readability (preferred) → Cheerio (site-specific selectors) → generic selectors. See `extractWithReadability` / `extractWithCheerio` in `scrape/route.ts`.
  - Image handling: scraped images are converted to WebP base64 via `sharp` (max 1200px, quality ~80%). Change image rules only in `scrape/route.ts`.
  - Summaries: Check Chrome Summarizer first (`Summarizer.availability()`), fallback to Transformers.js worker. Cache summaries on article records (`summary`, `summaryType`, `summaryLength`, `summarizedAt`).

  Developer workflows & examples

  - Add feed flow example: component → `useFeeds.addNewFeed(url)` → server `/api/rss?url=...` → `src/lib/db.ts` stores feed and articles.
  - Quick API tests:
    - `curl "http://localhost:3000/api/rss?url=https://example.com/feed"`
    - `curl "http://localhost:3000/api/scrape?url=https://example.com/article"`
  - DB migration: bump `DB_VERSION` in `src/lib/db.ts` and implement `upgrade()` behavior there.

  CI / platform notes

  - `sharp` is native — CI must support native builds. On Windows development: `pnpm rebuild sharp` if binary issues appear.
  - Node 22.x expected (check `engines` in `package.json`).

  Where to change things (common edit points)

  - Scraping rules / sanitization: `src/app/api/scrape/route.ts` (security review required for sanitize changes).
  - Feed presets & UI: `src/components/layout/AppShell.tsx` (`DEFAULT_FEEDS`).
  - Summarization models/config: `src/lib/summarization-models.ts` and `src/lib/summarization-transformers.ts`.
  - DB schema: `src/lib/db.ts` (`DB_VERSION`, object stores, indexes).

  MCP & debugging

  - Use Next.js DevTools MCP (`nextjs_index` / `nextjs_call`) for runtime compilation/hydration errors.
  - Use Chrome DevTools MCP for browser interactions (`take_snapshot`, `list_console_messages`, `take_screenshot`).

  If something is missing or you want more examples (e.g., a DB migration template, scraper checklist, or a test harness for the summarizer worker), tell me which and I’ll add it.
