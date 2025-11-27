## Copilot / AI agent quick instructions (short)

This repo: Next.js 16 (App Router) + React 19 offline-capable RSS reader. Client persists feeds & articles in IndexedDB; server exposes helper routes to avoid CORS / do Node-only processing.

Why the split:

- Server (src/app/api/\*): RSS parsing, scraping, and image processing are server-side to avoid CORS and to use native modules like `sharp`.
- Client (src/app and src/components): UI, persistence (IndexedDB via `src/lib/db.ts`), and local helpers (use `use client` where needed).

Key files (read first):

- `src/hooks/useFeeds.ts` — central client actions: add/remove feeds, scrape articles, local backups.
- `src/lib/db.ts` — IndexedDB schema, `DB_VERSION`, migrations, and all DB helpers (always use these functions; do not access IndexedDB directly).
- `src/app/api/rss/route.ts` — RSS parsing proxy (`rss-parser`), discovery & error classification.
- `src/app/api/scrape/route.ts` — scraping (Readability + Cheerio fallback), sanitization (`sanitize-html`), and image processing (`sharp`).
- `src/components/layout/AppShell.tsx` — default feeds (`DEFAULT_FEEDS`) and the main sidebar UI.

Quick commands:

- Install: `pnpm install`
- Run dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`

Important patterns and constraints:

- Anything that requires Node or native modules (e.g., `sharp`) must live under `src/app/api/*` (server). Avoid requiring Node things in client components.
- Use `src/lib/db.ts` for all IndexedDB operations. On migration, bump `DB_VERSION` and implement upgrade steps.
- Scraping pipeline: try Readability, fall back to site-specific `cheerio` selectors, optimize images with `sharp`, then sanitize with `sanitize-html`. Any changes to sanitization or allowed tags/attributes require security review.

How to test runtime behaviors:

- Use Next.js / Chrome DevTools MCP (see `.vscode/mcp.json`) for server-side scraping checks and console logs.
- Manual quick checks with curl:
  - `curl "http://localhost:3000/api/rss?url=https://example.com/feed"`
  - `curl "http://localhost:3000/api/scrape?url=https://example.com/article"`

CI / deployment notes:

- `sharp` is native — CI must support native modules. On Windows dev machines, run `npm rebuild sharp` if needed.
- Serverless environments may restrict headless browsers — prefer MCP for scraping validation.

Where to change things (common requests):

- Add feed presets: edit `DEFAULT_FEEDS` in `src/components/layout/AppShell.tsx`.
- Tune scraping selectors or sanitization: `src/app/api/scrape/route.ts` (security review needed).
- DB schema changes: `src/lib/db.ts` — bump `DB_VERSION` and write migration logic.

Security & review points:

- `Article.scrapedContent` is sanitized HTML rendered with `dangerouslySetInnerHTML` in `src/components/articles/ArticleView.tsx`. Keep sanitization conservative and add tests for any modifications.

If any part of this is unclear or you want more examples (DB upgrade sample, run/debug steps, or MCP usage), tell me which section to expand.
