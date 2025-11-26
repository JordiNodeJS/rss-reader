# Copilot / AI agent quick instructions

Summary: Next.js 16 App Router + React 19 offline RSS reader. Client persists data in IndexedDB; server exposes `/api/rss` and `/api/scrape` for feed parsing and article scraping. Use the Next.js / Chrome DevTools MCP for runtime debugging and scraping validation.

Essentials:

- Key files:

  - `src/hooks/useFeeds.ts` — client actions for feeds & scraping; central to UI flows.
  - `src/lib/db.ts` — IndexedDB helpers, types, `DB_VERSION`, and migration logic. Use these functions; do not access IndexedDB directly elsewhere.
  - `src/app/api/scrape/route.ts` — server-side scraping (Cheerio, Readability), sanitization (`sanitize-html`) and image processing (`sharp`). Changes here must be security-reviewed. Validate runtime scraping workflows using the Next.js / Chrome DevTools MCP.
  - `src/app/api/rss/route.ts` — server-side RSS parsing proxy (rss-parser).
  - `src/components/layout/AppShell.tsx` — default feeds; UI entry points like `DEFAULT_FEEDS`.

- Quick commands:
- Install: `pnpm install`
- Dev: `pnpm dev`
- Debugging / runtime checks: use Next.js MCP / Chrome DevTools MCP (`.vscode/mcp.json`) to inspect server-side scraping and runtime logs (see Next.js MCP docs).
- Build: `pnpm build`
- Lint: `pnpm lint`

- Patterns & constraints:
- Server vs Client: Anything that uses Node or native modules (e.g., `sharp`) must live under `src/app/api/*` (server side). Use the `use client` directive only in client components. Use the Next.js MCP and browser devtools to validate server-side scraping flows rather than requiring local headless browser installs.
- IndexedDB: Use `src/lib/db.ts` helpers—do not read IDB directly. When modifying schema, bump `DB_VERSION` and implement upgrade logic.
- Scraping & Security: `scrape/route.ts` sanitizes HTML. Avoid changing allowed tags or attributes without tests and a security review—sanitization changes increase XSS risk.
- Images: Scraper builds `imageMap` with base64 WebP in `scrapedContent`; maintain original URL fallback.

- Debug & testing:
- Use the Next.js MCP / Chrome DevTools MCP integration to verify routes, server-side rendering, and to collect runtime logs. Check server logs for stack traces and any thrown errors.
- Inspect API endpoints with `curl`:
  - `curl "http://localhost:3000/api/rss?url=https://example.com/feed"`
  - `curl "http://localhost:3000/api/scrape?url=https://example.com/article"`
- Windows: `sharp` is native. If install fails, run `npm rebuild sharp` or ensure Node LTS is used.

CI & deployment:

- CI must support native modules (e.g., `sharp`) and provide any required headless browsers in the CI environment if integration/acceptance tests rely on them (not required for MCP-based local debugging).
- Serverless platforms like Vercel may block headless browsers—prefer MCP testing, self-hosted scrapers, or runtime fallbacks.

What to change and where:

- Add default feeds: update `DEFAULT_FEEDS` in `src/components/layout/AppShell.tsx`.
- Tweak scraping selectors: update `src/app/api/scrape/route.ts` and sanitize rules if needed.
- DB migrations: bump `DB_VERSION` in `src/lib/db.ts` and implement migrator to convert old records.

Safety and review points:

- Scraped/sanitized HTML is rendered with `dangerouslySetInnerHTML` in `src/components/articles/ArticleView.tsx` — preserve `sanitize-html` config and add tests for any changes.
- Avoid adding headless browser references or usage in client files; scraping is server-side.

Where to look next:

- `src/hooks/useFeeds.ts` — core UI flow and persistence.
- `src/components/articles/ArticleView.tsx` — rendering scraped HTML.
- `src/app/api/scrape/route.ts` — primary place for scraping logic and images.

If you want, I can replace the existing `.github/copilot-instructions.md` with this shorter version, or integrate parts of the original document into this condensed format—tell me your preference.
