<!-- Copilot / AI agent instructions for rss-reader-antigravity -->
# Quick context

- Root framework: Next.js (App Router, Next.js 16+) + React 19.
- Purpose: Minimal offline-capable RSS reader. Client persists feeds & articles in IndexedDB; server provides two APIs:
  - `/api/rss?url=` parses RSS feeds (uses `rss-parser`).
  - `/api/scrape?url=` scrapes pages with Playwright + sanitize-html + sharp.

# Important files to inspect

- `src/app/page.tsx` — main client page; mounts `AppShell` and the article UI.
- `src/components/layout/AppShell.tsx` — sidebar, feed management, and add feed UI.
- `src/components/articles/ArticleList.tsx` / `ArticleView.tsx` — list/reader UI; scraping & reading flows.
- `src/hooks/useFeeds.ts` — central client-side state & actions (add feed, remove feed, scrape article) using `lib/db`.
- `src/lib/db.ts` — IndexedDB wrappers and schemas for `Feed` and `Article`.
- `src/app/api/rss/route.ts` — server RSS parsing proxy (rss-parser).
- `src/app/api/scrape/route.ts` — Playwright scraper, image optimization (sharp) and HTML sanitization.

# Quick start (dev machine recommendations)

1. Install deps:
   - pnpm (recommended), npm or bun is fine. Example:
     ```bash
     pnpm install
     ```
2. Install Playwright browsers (required by server scraper):
     ```bash
     npx playwright install chromium
     ```
3. Run dev server:
     ```bash
     pnpm dev
     # or npm run dev
     ```

Notes: `sharp` is a native module — if install errors occur on Windows, ensure a supported Node version (current LTS) and run `npm rebuild sharp` or follow platform instructions.

# Architecture & data flow (short)

- Client-only state and UI live under `src/app` & `src/components` and are marked `"use client"` when needed.
- Feeds and articles are stored in the browser IndexedDB via `src/lib/db.ts` (IDB wrapper). Use the exported functions instead of direct IDB usage.
- Feed parsing is proxied server-side (`/api/rss`) to avoid CORS & parser inconsistencies.
- Complex page scraping is handled server-side (`/api/scrape`) using Playwright to load pages, then `cheerio` to extract content and `sanitize-html` to sanitize. `sharp` optimizes images and embeds them as base64 webp data URLs.

# Conventions & important patterns

- Client vs server: Keep direct DOM-accessing or browser-only APIs (IndexedDB) in client components (`use client`). Server code must remain in `app/api` route handlers.
- Use typed interfaces `Feed` & `Article` from `src/lib/db.ts` for cross-file consistency.
- API responses return JSON with `error` & `details` fields on error; client uses `content-type` checks to guard parsing.
- Persist full sanitized HTML in `Article.scrapedContent`. The reader uses `dangerouslySetInnerHTML` — only accept sanitized content.
- Use the `cn` helper from `src/lib/utils.ts` to compose Tailwind classnames.

# Workflow tips for AI coding agents

- Adding a new feed source: update `DEFAULT_FEEDS` in `AppShell.tsx` for UI presets; `useFeeds.addNewFeed` handles actually saving.
- Adding server scraping changes: modify `src/app/api/scrape/route.ts` — update selectors or sanitization list carefully. Because scraped HTML is stored and displayed with `dangerouslySetInnerHTML`, add unit testing or manual review for XSS risks.
- If changing image optimization: follow the `imageMap` conversion to base64 in `scrape/route.ts` — maintain a fallback to original URLs.
- To update the offline storage schema (IDB): edit `DB_VERSION` in `src/lib/db.ts` and implement `upgrade` logic to migrate existing indexes.
- To debug scraping issues locally: run dev server and `curl` the API (or use Chrome network tools) to inspect `/api/scrape?url=...` responses; ensure Playwright browsers are installed.

# Build, test, and CI notes

- Dev: `pnpm dev` or `npm run dev`.
- Build: `pnpm build` or `npm run build`.
- Lint: `npm run lint` (ESLint). There is no `test` script yet.
- CI: Playwright & `sharp` may require additional setup (install browsers and runtime deps). For CI runs, add `npx playwright install chromium` and ensure native dependencies for `sharp` are available for the OS.

# Common pitfalls & gotchas

- Playwright on serverless platforms (Vercel, etc.) may fail — the route `src/app/api/scrape/route.ts` includes a helpful error message and suggests running `npx playwright install chromium`.
- All sanitization & user-visible HTML changes touch XSS risk — always validate sanitized results.
- IDB uniqueness constraints: articles use `guid` as a unique index — updates to feed items may need careful deduplication logic.

# Where to look for improvements

- Add `tests` and a `test` script (Jest or Playwright) to validate scraping & UI flows.
- Add a small e2e test to validate `add feed` → `list articles` → `scrape article` flow (Playwright test can run in CI if you add browser install step).

---
If anything is unclear, tell me which file or workflow you want clarified and I’ll expand this doc or add examples/tests.
