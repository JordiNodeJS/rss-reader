## RSS Reader Antigravity — AI Agent Guide

Brief: Next.js 16 + React 19 offline-first RSS reader. Client-side IndexedDB storage with server-side RSS/scraping proxies. Focused on Spanish media.

**Quick Commands:**

- `pnpm install` / `pnpm dev` (http://localhost:3000)
- `pnpm build && pnpm start`
- `pnpm lint`
- `pnpm rebuild sharp` (Fix binary errors on Windows)

**Big Picture Architecture:**

- **App Router (Next.js 16)**: Server components (e.g., [src/app/page.tsx](src/app/page.tsx)) read cookies/headers and pass props to client components (e.g., [src/app/page.client.tsx](src/app/page.client.tsx)).
- **Offline-First**: All data lives in **IndexedDB** ([src/lib/db.ts](src/lib/db.ts)). [src/hooks/useFeeds.ts](src/hooks/useFeeds.ts) is the **single source of truth** for all feed/article operations.
- **Server Proxies**: All external fetches (RSS, Scraping) MUST go through `/api/*` routes to avoid CORS and bundle Node-only libs (e.g., `sharp`, `jsdom`).
- **Theme Bootstrapping**: [src/app/layout.tsx](src/app/layout.tsx) injects a pre-React script to apply themes from `localStorage` to `<html>` to prevent FOUC.

**Critical Files & Patterns:**

- **Feed Lifecycle**: `useFeeds.addNewFeed(url)` -> `/api/rss` -> `db.ts` storage.
- **Scraping**: `/api/scrape` uses `Readability` -> `Cheerio` fallback -> `sharp` (WebP conversion).
- **AI Summarization**: Use [src/hooks/useSummary.ts](src/hooks/useSummary.ts). Supports Chrome Summarizer (Nano), Gemini Proxy, and local Transformers.js.
- **Error Handling**: Throw `UserError` (from `useFeeds.ts`) for expected faults (shown via `toast`). Use `Error` for developer faults.
- **Activity Tracking**: Report long-running tasks via `useActivityStatus()` (e.g., `fetching-rss`, `scraping`).
- **Monitoring**: [src/lib/db-monitor.ts](src/lib/db-monitor.ts) logs IndexedDB events (e.g., unexpected deletions) for debugging in the sidebar.

**Project Conventions:**

- **pnpm Only**: Never use `npm` or `yarn`. Use `pnpm dlx` for one-off tools.
- **Spanish Focus**: User-facing strings and scraper rules are optimized for Spanish news outlets.
- **DB Resilience**: Feeds are backed up to `localStorage` (`FEEDS_BACKUP_KEY`) and restored if IndexedDB is cleared.
- **Theme System**: Themes are CSS files in `public/styles/themes/`. Managed via [src/lib/theme-loader.ts](src/lib/theme-loader.ts).

**Testing & Debugging:**

- **UI Testing**: Use **chrome-devtools MCP** for real browser testing (detects hydration/runtime errors).
- **Next.js Diagnostics**: Use **next-devtools MCP** to inspect routes, SSR boundaries, and compilation errors.
- **API Checks**:
  - `curl "http://localhost:3000/api/rss?url=..."`
  - `curl "http://localhost:3000/api/scrape?url=..."`

**Where To Edit:**

- **Scraper Rules**: [src/app/api/scrape/route.ts](src/app/api/scrape/route.ts)
- **DB Schema**: [src/lib/db.ts](src/lib/db.ts) (Bump `DB_VERSION` for migrations)
- **UI Shell**: [src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx)
- **AI Models**: [src/lib/summarization-models.ts](src/lib/summarization-models.ts)

**AI Agent Memory & Strategy:**

- **Long-Term Memory**: Use the `.agent/` and `.cursor/` folders to store strategies, plans, and tasks for long-term memory in agent mode.
- **Documentation**: The `docs/` folder can also be used to organize AI-related strategies, research, and project management notes. Subfolders like `docs/project-management/`, `docs/research/`, and `docs/standards/` are ideal for this purpose.
