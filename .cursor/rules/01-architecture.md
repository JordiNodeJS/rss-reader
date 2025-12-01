---
description: Core architecture patterns, data flows, and structural decisions
alwaysApply: true
---

# Architecture & Patterns

## Project Overview

RSS Reader Antigravity is a Next.js 16 (App Router) application with offline-first architecture using IndexedDB for persistence. The app provides RSS feed reading, article scraping, AI summarization, and a theme system.

## Key Technologies

- **Framework**: Next.js 16.0.3 (App Router), React 19.2.0
- **Styling**: Tailwind CSS 4, Shadcn UI components
- **Storage**: IndexedDB via `idb` library
- **Scraping**: Mozilla Readability (primary) + Cheerio (fallback)
- **AI**: Transformers.js for local summarization, Chrome Summarizer API support
- **Package Manager**: pnpm (see `00-package-manager.md`)

## Data Flow Architecture

### IndexedDB Schema (`src/lib/db.ts`)

The app uses a single IndexedDB database `rss-reader-db` with two object stores:

1. **feeds**: Stores RSS feed metadata
   - Index: `by-url` (unique)
   - Fields: `id`, `url`, `title`, `customTitle`, `description`, `icon`, `addedAt`, `order`, `isFavorite`

2. **articles**: Stores article content
   - Indexes: `by-feed`, `by-guid` (unique), `by-link`
   - Fields include: `id`, `feedId`, `guid`, `title`, `link`, `pubDate`, `content`, `scrapedContent`, `translatedContent`, `summary`, `isRead`, `isSaved`, `isFavorite`

**Pattern**: Always check for existing records by unique index before adding (e.g., `getFromIndex("feeds", "by-url", url)`) to prevent duplicates.

### API Routes Pattern

All API routes are in `src/app/api/`:

- **`/api/rss`**: Server-side RSS parsing proxy (avoids CORS)
  - Uses `rss-parser` with custom fields for Spanish media
  - Includes feed discovery fallback for 404s
  - Returns structured JSON with `_meta` field

- **`/api/scrape`**: Article content extraction
  - Primary: Mozilla Readability (`extractWithReadability`)
  - Fallback: Cheerio with site-specific selectors (`extractWithCheerio`)
  - Optimizes images with Sharp (converts to WebP, base64 data URLs)
  - Sanitizes HTML with `sanitize-html`

**Pattern**: API routes handle all external fetching to avoid CORS issues. Client components call these routes, never fetch RSS directly.

## Component Patterns

### Client Components

All interactive components use `"use client"` directive. Key patterns:

- **Custom Hooks**: Business logic in hooks (`useFeeds`, `useSummary`, `useTranslation`)
- **State Management**: React state + IndexedDB operations (no global state library)
- **Error Handling**: `UserError` class for user-facing errors (logs as `warn`, not `error`)

Example from `src/hooks/useFeeds.ts`:
```typescript
class UserError extends Error {}
// User-facing errors use console.warn, not console.error
```

### Layout Structure

- **`AppShell`** (`src/components/layout/AppShell.tsx`): Main layout with resizable sidebar
  - Desktop: Fixed sidebar with drag-to-resize (260-600px width)
  - Mobile: Sheet-based sidebar
  - Sidebar width persisted in localStorage + cookie for SSR

- **Theme System**: Dynamic CSS loading per theme
  - Themes in `public/styles/themes/*.css`
  - Theme state in localStorage (`rss-reader-theme-config`)
  - Font preloading per theme (Google Fonts)
  - Theme script in `layout.tsx` runs before React hydration

## Scraping Architecture

### Hybrid Extraction Strategy

1. **Primary**: Mozilla Readability (`@mozilla/readability` + `jsdom`)
   - Algorithm-based, no selectors needed
   - Works for most well-structured articles

2. **Fallback**: Cheerio with site-specific selectors
   - Hardcoded selectors for Spanish news sites (eldiario.es, publico.es, etc.)
   - Generic selectors as last resort
   - Removes ads, scripts, navigation

3. **Image Optimization**: All images converted to WebP base64 data URLs
   - Sharp resizes to max 1200x1200px
   - Quality 80%
   - Processed in parallel for performance

**Pattern**: Always try Readability first, fall back to Cheerio. Log the method used for debugging.

## Summarization System

### Dual-Model Approach (`src/lib/summarization.ts`)

1. **Chrome Summarizer API** (preferred if available)
   - Requires Chrome 138+
   - Checks availability with `Summarizer.availability()`
   - Caches summarizer instances by configuration

2. **Transformers.js** (fallback, default)
   - Local models: `distilbart-cnn-12-6` (default)
   - Runs in Web Worker for performance
   - Supports lengths: `short`, `medium`, `long`, `extended`
   - Auto-translates to Spanish if needed

**Pattern**: Check Chrome API first, fall back to Transformers.js. Cache summaries in article record.

## Development Workflows

### Build Commands

```bash
pnpm dev          # Start dev server (Next.js 16)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
```

### Key Configuration Files

- **`next.config.ts`**: Turbopack aliases for browser compatibility (excludes `sharp`, `onnxruntime-node` from client bundle)
- **`tsconfig.json`**: Path alias `@/*` → `./src/*`, excludes `scripts/`
- **`tailwind.config.ts`**: Uses CSS variables for theming, typography plugin

### Type Safety Patterns

- **Strict TypeScript**: `strict: true` in tsconfig
- **No `any` types**: Use `unknown` and type guards (see `extractUrlFromUnknown` in `useFeeds.ts`)
- **IndexedDB Types**: DBSchema interface ensures type safety

## Error Handling Conventions

1. **User-facing errors**: Use `UserError` class, log with `console.warn`
2. **Developer errors**: Use standard `Error`, log with `console.error`
3. **API errors**: Return structured JSON with `error`, `errorType`, `details`, `suggestion`
4. **Toast notifications**: Use `sonner` for user feedback

## Performance Optimizations

- **Lazy loading**: Heavy components like `CacheManager` use `React.lazy()`
- **Image optimization**: All scraped images converted to WebP
- **Database indexes**: Optimized queries with IndexedDB indexes
- **LocalStorage backup**: Feeds backed up to localStorage as resilience layer
- **Theme preloading**: CSS and fonts preloaded to prevent FOUC

## Key Files Reference

- **Database**: `src/lib/db.ts` - All IndexedDB operations
- **Feeds Hook**: `src/hooks/useFeeds.ts` - Feed management logic
- **Scraping**: `src/app/api/scrape/route.ts` - Article extraction
- **RSS Parsing**: `src/app/api/rss/route.ts` - Feed fetching
- **Summarization**: `src/lib/summarization.ts` - AI summary generation
- **Theme System**: `src/components/theme-provider.tsx`, `src/lib/theme-loader.ts`
- **Layout**: `src/components/layout/AppShell.tsx` - Main app shell

