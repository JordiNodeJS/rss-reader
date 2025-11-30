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

| Feature       | Implementation                                                                       |
| ------------- | ------------------------------------------------------------------------------------ |
| Translation   | Chrome Translator API only (native, Chrome 131+). No Transformers.js fallback.       |
| Summarization | Transformers.js with DistilBART models (local, browser-based). No Chrome Summarizer. |

**Key files:**

- `src/lib/translation.ts` — Chrome Translator API wrapper (multi-language → Spanish)
- `src/lib/summarization.ts` — Re-exports from summarization-transformers
- `src/lib/summarization-transformers.ts` — Transformers.js summarization with Web Worker
- `src/lib/summarization-models.ts` — Model definitions (DistilBART variants)
- `src/hooks/useSummary.ts` — React hook for summarization + optional translation to Spanish
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

### ⚠️ Hydration & SSR Rules (CRITICAL)

**NEVER use `suppressHydrationWarning`** — it only hides problems, doesn't fix them.

Browser extensions like Dark Reader modify inline styles (`backgroundColor`, `color`, etc.) before React hydrates, causing mismatches. The correct solution:

#### Pattern: Client-only inline styles

Use `useSyncExternalStore` to detect client-side rendering:

```tsx
// Hook to detect client-side rendering without hydration issues
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}

// Usage in component
const isClient = useIsClient();

// Only apply inline styles on client
<span style={isClient ? { backgroundColor: color } : undefined} />;
```

#### Why this works:

- Server renders without inline styles → no content for extensions to modify
- Client hydrates with same empty styles → perfect match
- After hydration, `isClient` becomes `true` → styles apply
- No flash, no warnings, proper solution

#### Common pitfalls to avoid:

- ❌ `suppressHydrationWarning` — hides the problem
- ❌ `useState` + `useEffect` for mount detection — React 19 linter warns about cascading renders
- ❌ Inline styles with dynamic values during SSR — extensions will modify them
- ✅ `useSyncExternalStore` — the React-recommended approach for this pattern
