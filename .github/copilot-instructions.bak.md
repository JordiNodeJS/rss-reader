````instructions
<!-- Copilot / AI agent instructions for rss-reader-antigravity (BACKUP) -->
# Quick context

- Root framework: Next.js (App Router, Next.js 16+) + React 19.
- Purpose: Minimal offline-capable RSS reader. Client persists feeds & articles in IndexedDB; server provides two APIs:
  - `/api/rss?url=` parses RSS feeds (uses `rss-parser`).
  - `/api/scrape?url=` scrapes pages with server-side scraping (Readability/Cheerio) + `sanitize-html` + `sharp` for images; use the Next.js / Chrome DevTools MCP for runtime debugging and scraping validation.

# Important files to inspect

- `src/app/page.tsx` — main client page; mounts `AppShell` and the article UI.
- `src/components/layout/AppShell.tsx` — sidebar, feed management, and add feed UI.
- `src/components/articles/ArticleList.tsx` / `ArticleView.tsx` — list/reader UI; scraping & reading flows.
- `src/hooks/useFeeds.ts` — central client-side state & actions (add feed, remove feed, scrape article) using `lib/db`.
- `src/lib/db.ts` — IndexedDB wrappers and schemas for `Feed` and `Article`.
- `src/app/api/rss/route.ts` — server RSS parsing proxy (rss-parser).
- `src/app/api/scrape/route.ts` — server-side scraper, image optimization (sharp) and HTML sanitization.

# Quick start (dev machine recommendations)

1. Install deps:
   - pnpm (recommended), npm or bun is fine. Example:
     ```bash
     pnpm install
     ```
2. Use the Next.js / Chrome DevTools Model Context Protocol (MCP) to validate and debug server-side scraping routines (avoid local Playwright installs when debugging).
3. Run dev server:
     ```bash
     pnpm dev
     # or npm run dev
     ```

Notes: `sharp` is a native module — if install errors occur on Windows, ensure a supported Node version (current LTS) and run `npm rebuild sharp` or follow platform instructions.

<!-- Copilot / AI agent instructions for rss-reader-antigravity BACKUP -->

# Summary

Minimal, offline-capable RSS reader built with Next.js (App Router, Next 16+) + React 19.
Client persists feeds & articles in IndexedDB; the server exposes two helper APIs:

- `/api/rss?url=` — server-side RSS parsing (uses `rss-parser`) to avoid CORS and parser differences.
- `/api/scrape?url=` — server-side scraping using `cheerio` + `sanitize-html` and image processing with `sharp`.

# Quick start (commands)

```bash
pnpm install
pnpm dev
# Build: pnpm build
# Lint: pnpm lint
```

Windows note: `sharp` is native — if install fails run `npm rebuild sharp` and use a supported Node LTS.

# Key files to read first

- `src/app/page.tsx` — app entry and top-level layout.
- `src/components/layout/AppShell.tsx` — sidebar, feed list, `DEFAULT_FEEDS` presets.
- `src/components/BrandingBanner.tsx` — header with status badge and theme toggle (scroll behavior).
- `src/hooks/useFeeds.ts` — client feed API, persistence calls to `src/lib/db.ts` and calls to server APIs.
- `src/lib/db.ts` — IndexedDB schema, `DB_VERSION`, and helper functions (use these — do not access IDB directly).
- `src/app/api/scrape/route.ts` — server-side scraping flow, `imageMap` base64 conversion, sanitization rules.
- `src/app/api/rss/route.ts` — RSS parsing proxy.

# Architecture & patterns (concise)

- Client-only UI/components live under `src/app` / `src/components` and use `"use client"` where needed.
- Persisted data model: `Feed` and `Article` typed in `src/lib/db.ts`. Articles use `guid` as a uniqueness key.
- Server responsibilities: heavy lifting that needs Node APIs or avoids CORS (RSS parsing, scraping, image processing).
- Security: scraped HTML is sanitized and stored in `Article.scrapedContent` and later rendered with `dangerouslySetInnerHTML` — treat sanitization carefully.
- Styling: Tailwind utility classes + a `cn` helper in `src/lib/utils.ts` are used for conditional classnames.

# Common developer tasks & where to make changes

- Add a default feed shown in the UI: edit `DEFAULT_FEEDS` in `src/components/layout/AppShell.tsx`.
- Add / tune scraping selectors or sanitization: edit `src/app/api/scrape/route.ts` (keep `cheerio` selectors minimal and update allowed tags in `sanitize-html`).
- Change offline DB schema: bump `DB_VERSION` in `src/lib/db.ts` and implement upgrade logic there.
- Image handling: `src/app/api/scrape/route.ts` builds an `imageMap` that converts images to base64 webp; maintain a fallback to original URLs.

# Debugging & run-time checks

- If scraping fails locally, use the Next.js / Chrome DevTools MCP to inspect runtime and server logs; verify server logs for stack traces.
- Use `curl` or browser devtools to inspect responses from `/api/scrape?url=...` and `/api/rss?url=...` (the routes return `{ error, details }` on failure).
- Server-side scraping errors surface in server logs; check the dev server terminal for stack traces.

# CI / deployment notes

- CI must provide native build support for `sharp`. If your CI needs to run headless browser-based scraping tests, install and configure headless browsers or use dedicated test runners; otherwise prefer MCP-based validation.
- Serverless platforms (Vercel) may restrict headless browsers — check `src/app/api/scrape/route.ts` for its runtime checks and error guidance and prefer MCP or hosted scraping services.

# Quick examples

- Add a feed preset: edit `DEFAULT_FEEDS` in `src/components/layout/AppShell.tsx`.
- Run a scrape locally: start dev server then:
     `curl "http://localhost:3000/api/scrape?url=https://example.com/article"`

# Safety & review points for AI agents

- Always preserve or surface sanitization rules when modifying `scrape/route.ts` — any change here affects XSS risk.
- When touching `db.ts`, keep migration logic and `DB_VERSION` changes explicit and backward-compatible.

# Where to look next (developer orientation)

- `src/hooks/useFeeds.ts` — central place connecting UI actions to persistence and server APIs.
- `src/components/articles/ArticleView.tsx` — how stored HTML is rendered to the user.
- `src/components/BrandingBanner.tsx` — example of polished UI interactions (scroll-driven state + transitions).

If you want, I can shorten any section, add command snippets for CI, or expand migration examples (DB upgrade code sample). Please tell me which area to expand.
````
