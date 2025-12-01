## RSS Reader Antigravity — Copilot/AI Agent Quick Guide

Brief: Next.js 16 + React 19 offline-first RSS reader. Server does scraping/parsing; client is UI + IndexedDB.

- Quick commands (pnpm required):

  - Install & dev: `pnpm install` → `pnpm dev` (http://localhost:3000)
  - Prod: `pnpm build && pnpm start`
  - Lint: `pnpm lint`
  - E2E: `pnpm dlx playwright install` + `pnpm dlx playwright test`

- Big picture & why:

  - Client components (UI) use `use client`; avoid Node native libs in client code.
  - Server APIs (`src/app/api/*`) handle all external fetches, CORS bypass, scraping, and image optimization.
  - Heavy Node-only libs: `sharp`, `jsdom`, `rss-parser` must live in API routes.

- Top files to read immediately:

  - `src/hooks/useFeeds.ts`: feed lifecycle, DB backup, `UserError`, and RSS fetch flow (calls `/api/rss`).
  - `src/lib/db.ts`: IndexedDB schema, stores (`feeds`, `articles`), indexes and migration (`DB_VERSION`).
  - `src/app/api/scrape/route.ts`: Readability → Cheerio fallback → `sharp` image conversion → `sanitize-html`.
  - `src/app/api/rss/route.ts`: RSS parsing proxy (`rss-parser`) with error classification and fallback.
  - `src/lib/summarization.ts` + `src/lib/summarization-transformers.ts`: Summarizer entry points, Chrome API vs Transformers.js worker.

- Project-specific patterns:

  - DB-first: use `src/lib/db.ts` helpers (addFeed, addArticle, updateArticleSummary) — never raw IndexedDB.
  - Local backup: feeds are backed up to localStorage; `useFeeds` restores automatically if DB is empty.
  - Error convention: throw `UserError` for expected user-facing issues (log as `console.warn`).
  - Activity UI: prefer `useActivityStatus()` for long tasks such as `fetching-rss`, `scraping`, `translating`.

- Scraping & summarization rules:

  - Scraper order: Readability (best) → Cheerio fallback (site-specific selectors) → image optimization → sanitize.
  - Summarization: Check `Summarizer` availability (Chrome) and fall back to Transformers.js in a Web Worker; cache models & results in IndexedDB.
  - Summary fields saved on Article: `summary`, `summaryType`, `summaryLength`, `summarizedAt`.

- Security & CI notes:

  - `scrape/route.ts` sanitizes content; changing sanitize rules needs a security review.
  - `sharp` is a native module — CI must support native builds (Windows: `pnpm rebuild sharp` if required).
  - `next.config.ts` uses `remotePatterns: [{ hostname: '**' }]` for RSS images—narrow in production.

- Debug & tests:
  - Use Next.js DevTools MCP (`nextjs_index`/`nextjs_call`) and Chrome DevTools MCP for runtime checks and console logs.
  - Quick curl tests: `curl "http://localhost:3000/api/rss?url=https://example.com/feed"` and `curl "http://localhost:3000/api/scrape?url=https://example.com/article"`.

If you'd like, I can also add: a short checklist for changes to `scrape/route.ts`, a DB migration template, or a short test harness example for the summarizer worker.

## RSS Reader Antigravity — Copilot/AI Agent Quick Guide

Short: Next.js 16 App Router + React 19 RSS reader. Offline-first (IndexedDB), server-side scraping, and in-browser summarization.

- Always use pnpm (NOT npm/yarn); Node 22.x required.

  - Commands: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`.
  - For E2E: `pnpm dlx playwright install` and `pnpm dlx playwright test`.

- High-level architecture:

  - Client (browser) = UI, IndexedDB persistence, hooks (`useFeeds`, `useSummary`, `useTranslation`).
  - Server (`src/app/api/*`) = RSS parsing, scrape pipeline, image optimization. Node-only libs (sharp, jsdom, rss-parser) must stay server-side.

- Most-read files & why:

  - `src/hooks/useFeeds.ts` — feed lifecycle, fetch via `/api/rss`, localStorage backup, `UserError` conventions.
  - `src/lib/db.ts` — single DB with `feeds` and `articles` object stores, indexes: `by-url`, `by-feed`, `by-guid`.
  - `src/app/api/rss/route.ts` — RSS proxy avoiding CORS; parses and returns normalized `items`.
  - `src/app/api/scrape/route.ts` — Readability primary extractor, Cheerio fallbacks for site-specific selectors, `sharp` image optimization and HTML sanitization.
  - `src/lib/summarization.ts` & `src/lib/summarization-transformers.ts` — summarization backends, model caching and worker usage.

- Practical dev tips & conventions:

  - Server/Client boundary: Avoid importing Node native libs in client components; use API routes for server logic.
  - IndexedDB access: Always use `src/lib/db.ts` helpers, never raw IndexedDB calls.
  - DB migrations: Increment `DB_VERSION` in `src/lib/db.ts` and update `upgrade()` logic.
  - Activity UI: Use `useActivityStatus()` context to indicate long operations (e.g., `fetching-rss`, `scraping`, `translating`).
  - Errors: Use `UserError` for expected user feedback (log with `console.warn`). Developer errors use `Error` and `console.error`.

- Summarization patterns:

  - Prefer Chrome Summarizer (if available) → fallback to Transformers.js with a Web Worker.
  - Summaries saved in `Article` record fields (`summary`, `summaryType`, `summaryLength`).
  - Summary lengths/types: `short`, `medium`, `long`, `extended` and types like `tldr`, `key-points`, `teaser`.

- Security & performance notes:

  - `scrape/route.ts` sanitizes user content with `sanitize-html`. Any changes require security review.
  - `sharp` is native — CI must support native builds. On Windows, run `pnpm rebuild sharp` if needed.
  - `next.config.ts` allows remote images; confirm `remotePatterns`/security for production.

- Testing & debugging:

  - Use Next.js DevTools and Chrome DevTools MCP for runtime diagnostics (`nextjs_index`/`nextjs_call` and DevTools actions).
  - Quick API tests: `curl "http://localhost:3000/api/rss?url=https://example.com/feed"` and `/api/scrape`.

- Where to extend or modify specific features:
  - Add site-specific scraping rules: `src/app/api/scrape/route.ts` (hostname switch).
  - Change sanitization or scraping behavior: the sanitize rules in `src/app/api/scrape/route.ts` require review.
  - Add feeds presets: `DEFAULT_FEEDS` in `src/components/layout/AppShell.tsx`.

If anything here is unclear or you need more details (e.g., file examples or code patterns), tell me what to expand and I’ll update the guide.

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
| New translation languages | Chrome Translator in `src/lib/translation.ts`                              |
| Summarization models      | `SUMMARIZATION_MODELS` in `src/lib/summarization-models.ts`                |
| Theme customization       | `public/styles/themes/*.css`                                               |

### AI Features Architecture

| Feature       | Implementation                                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Translation   | Chrome Translator API only (native, Chrome 131+). No Transformers.js fallback.                                                                                                                                          |
| Summarization | Transformers.js with DistilBART models (local, browser-based); `extended` summary option available. Chrome Summarizer API is optional but not required (Transformers.js fallback used for cross-browser compatibility). |

**Key files:**

- `src/lib/translation.ts` — Chrome Translator API wrapper (multi-language → Spanish)
- `src/lib/summarization.ts` — Re-exports from summarization-transformers
- `src/lib/summarization-transformers.ts` — Transformers.js summarization with Web Worker
- `src/lib/summarization-models.ts` — Model definitions (DistilBART variants)
- `src/hooks/useSummary.ts` — React hook for summarization + optional translation to Spanish
  - `src/hooks/useSummary.ts` — React hook for summarization + optional translation to Spanish, default behavior translates to Spanish and supports `extended` summary length
- `src/hooks/useTranslation.ts` — React hook for article translation

### Security Considerations

- `Article.scrapedContent` uses `dangerouslySetInnerHTML` in `ArticleView.tsx`. All content passes through `sanitize-html` — keep allowlist conservative.
- Any changes to HTML sanitization rules require security review.

### CI / Deployment Notes

- `sharp` is a native module — CI must support native builds. Windows: `pnpm rebuild sharp` if needed.
- Node 22.x required (see `engines` in `package.json`).

### 🔧 Debugging con DevTools MCPs

Usa **Chrome DevTools MCP** y **Next.js DevTools MCP** de forma complementaria:

| Herramienta          | Uso principal                                                                           |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Chrome DevTools**  | Probar UI: `take_snapshot`, `click`, `fill`, `take_screenshot`, `list_console_messages` |
| **Next.js DevTools** | Errores Next.js: `nextjs_index` → `nextjs_call` para errores de compilación/runtime     |

**Flujo rápido:**

1. `nextjs_index` → detectar servidor Next.js
2. `nextjs_call` → verificar errores de compilación/hidratación
3. `take_snapshot` → estado actual de la UI
4. Interactuar (`click`, `fill`) → probar funcionalidad
5. `list_console_messages` → errores del navegador

**Casos comunes:**

- **Errores hidratación**: `nextjs_call` + `list_console_messages`
- **Validar diseño**: `take_snapshot` + `take_screenshot`
- **Probar formularios**: `fill` + verificar respuesta
  Replace file with a concise, focused Copilot instruction set tailored to the repo: architecture, critical files, commands, patterns, MCP usage, and security cautions.

### ⚠️ Hydration & SSR Rules (CRITICAL)
