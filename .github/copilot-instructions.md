## RSS Reader Antigravity — AI Agent Instructions

Next.js 16 (App Router) + React 19 offline-capable RSS reader. **Always use `pnpm`** (never npm/yarn).

### Architecture Overview

```
Client (browser)                 Server (src/app/api/*)
├─ IndexedDB persistence         ├─ /api/rss — RSS parsing (rss-parser)
├─ useFeeds hook (state)         ├─ /api/scrape — Article extraction
└─ Components (use client)       └─ /api/check-iframe — Embed validation
```

**Why this split?** Node-only modules (`sharp`, `jsdom`, `rss-parser`) and CORS-bypassing fetch must run server-side. Client owns UI and offline storage.

### Key Files to Read First

| File                                 | Purpose                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `src/hooks/useFeeds.ts`              | Central client state: add/remove feeds, scrape articles, localStorage backup     |
| `src/lib/db.ts`                      | IndexedDB schema (`Feed`, `Article`), `DB_VERSION`, migrations, all CRUD helpers |
| `src/app/api/scrape/route.ts`        | Readability → Cheerio fallback → `sharp` image optimization → `sanitize-html`    |
| `src/app/api/rss/route.ts`           | RSS parsing proxy with retry logic and error classification                      |
| `src/components/layout/AppShell.tsx` | Sidebar UI, `DEFAULT_FEEDS` presets, drag-and-drop feed ordering                 |

### Commands

```bash
pnpm install     # Install dependencies (always pnpm)
pnpm dev         # Start dev server at localhost:3000
pnpm build       # Production build
pnpm lint        # ESLint
```

### Critical Patterns

1. **Server vs Client boundary**: Anything importing `sharp`, `jsdom`, `cheerio`, or `rss-parser` → must be in `src/app/api/*`. Client components use `"use client"` directive.

2. **IndexedDB access**: Always use functions from `src/lib/db.ts` (e.g., `addFeed`, `getAllArticles`, `updateArticleScrapedContent`). Never access IndexedDB directly.

3. **DB migrations**: Bump `DB_VERSION` in `src/lib/db.ts` and add upgrade logic in `openDB({ upgrade })`.

4. **Scraping pipeline order**: Readability first → site-specific Cheerio selectors (see hostname switch in `scrape/route.ts`) → image optimization → HTML sanitization.

5. **Activity status**: Use `useActivityStatus()` context to show loading states (`fetching-rss`, `scraping`, `translating`, etc.).

### API Testing (Quick Checks)

```bash
curl "http://localhost:3000/api/rss?url=https://example.com/feed"
curl "http://localhost:3000/api/scrape?url=https://example.com/article"
```

Or use Chrome DevTools MCP / Next.js DevTools MCP configured in `.vscode/mcp.json`.

### Common Change Locations

| Task                      | Where                                                                      |
| ------------------------- | -------------------------------------------------------------------------- |
| Add default feed presets  | `DEFAULT_FEEDS` in `src/components/layout/AppShell.tsx`                    |
| Add site-specific scraper | Hostname switch in `src/app/api/scrape/route.ts`                           |
| Modify sanitization rules | `sanitizeHtml` options in `src/app/api/scrape/route.ts` ⚠️ security review |
| DB schema changes         | `src/lib/db.ts` — bump `DB_VERSION`, add migration                         |
| New translation languages | `SUPPORTED_LANGUAGES` in `src/components/articles/ArticleView.tsx`         |
| Theme customization       | `public/styles/themes/*.css`                                               |

### Security Considerations

- `Article.scrapedContent` uses `dangerouslySetInnerHTML` in `ArticleView.tsx`. All content passes through `sanitize-html` — keep allowlist conservative.
- Any changes to HTML sanitization rules require security review.

### CI / Deployment Notes

- `sharp` is a native module — CI must support native builds. Windows: `pnpm rebuild sharp` if needed.
- Node 22.x required (see `engines` in `package.json`).
