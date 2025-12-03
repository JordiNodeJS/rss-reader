## RSS Reader Antigravity — Copilot / AI Agent Quick Guide

Brief: Next.js 16 + React 19 offline-first RSS reader. Client is UI + IndexedDB; server hosts all external fetches, scraping and node-only libs.

**Quick Commands:**
- `pnpm install`
- `pnpm dev` (dev server at http://localhost:3000)
- `pnpm build && pnpm start`
- `pnpm lint`
- `pnpm dlx playwright install` && `pnpm dlx playwright test` (E2E)

**Big Picture:**
- App Router (Next.js 16). Server code and Node-native libs live in API routes under `src/app/api/*` to avoid client bundling and CORS problems.
- Client uses IndexedDB via `src/lib/db.ts` (DB-first). UI state flows through hooks in `src/hooks/*` and contexts in `src/contexts/*`.

**Critical Files (read first):**
- `src/hooks/useFeeds.ts` — feed lifecycle, `useFeeds.addNewFeed(url)` flow, `UserError` for user-facing faults.
- `src/lib/db.ts` — IndexedDB schema, `DB_VERSION`, migrations, helpers (`addFeed`, `addArticle`, `getFromIndex`).
- `src/app/api/rss/route.ts` — RSS parsing proxy (uses `rss-parser`).
- `src/app/api/scrape/route.ts` — scraper pipeline: Readability → Cheerio → sanitization → image optimization (`sharp`).
- `src/lib/summarization*.ts` — summarization entrypoints and fallbacks (Chrome Summarizer → Transformers worker).
- `src/components/layout/AppShell.tsx` — UI shell, `DEFAULT_FEEDS`, theme handling.

**Project-Specific Conventions:**
- Always use `pnpm` (see `.cursor/rules/00-package-manager.md`). Use `pnpm dlx` instead of `npx`.
- DB-first: use `src/lib/db.ts` helpers; avoid raw IndexedDB access elsewhere.
- Error handling: throw `UserError` for expected/user-facing issues (log with `console.warn`). Use `Error` + `console.error` for developer-level faults.
- Long-running tasks: report via `ActivityStatusContext` / `useActivityStatus()` (types: `fetching-rss`, `scraping`, `translating`).

**Scraping & Summarization Rules (concrete):**
- Scraper order: `extractWithReadability` → `extractWithCheerio` → generic selectors. See `src/app/api/scrape/route.ts`.
- Images: converted to WebP (max 1200px, ~80% quality) in `scrape/route.ts` via `sharp` — change rules only there.
- Summaries: prefer Chrome Summarizer (`Summarizer.availability()`), fallback to Transformers.js worker; cache on article records (`summary`, `summaryType`, `summaryLength`, `summarizedAt`).

**Common Workflows & Examples:**
- Add feed: component → `useFeeds.addNewFeed(url)` → server `/api/rss?url=...` → `src/lib/db.ts` stores feed + articles.
- Quick API checks:
  - `curl "http://localhost:3000/api/rss?url=https://example.com/feed"`
  - `curl "http://localhost:3000/api/scrape?url=https://example.com/article"`
- DB migration: bump `DB_VERSION` in `src/lib/db.ts` and implement `upgrade()` logic there.

**Platform / CI Notes:**
- `sharp` is native — CI must support native builds. On Windows dev: `pnpm rebuild sharp` if you get binary errors.
- Node 22.x expected (see `engines` in `package.json`).

**Where To Make Changes (common edit points):**
- Scraper & sanitize rules: `src/app/api/scrape/route.ts` (security review required for sanitize changes).
- Feed presets / UI: `src/components/layout/AppShell.tsx` (`DEFAULT_FEEDS`).
- Summarization config: `src/lib/summarization-models.ts` & `src/lib/summarization-transformers.ts`.
- DB schema: `src/lib/db.ts` (`DB_VERSION`, stores, indexes).

If you'd like, I can add a DB migration template, a scraper test checklist, or a summarizer worker test harness — tell me which and I’ll add it.
