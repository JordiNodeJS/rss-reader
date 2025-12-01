---
description: Theme system architecture and AI summarization patterns
alwaysApply: true
---

# Theme System & AI Summarization

## Theme System Architecture

### Dynamic CSS Loading

Themes are loaded dynamically via CSS files in `public/styles/themes/*.css`. Each theme defines CSS variables that override Tailwind's default color scheme.

**Key Files**:
- `src/components/theme-provider.tsx`: Wraps `next-themes` provider
- `src/components/theme-initializer.tsx`: Loads theme CSS on mount
- `src/lib/theme-loader.ts`: Dynamic theme loading utilities
- `src/app/layout.tsx`: Theme script runs before React hydration

### Theme Initialization Flow

1. **Pre-hydration Script** (in `layout.tsx`):
   - Reads theme from localStorage (`rss-reader-theme-config`)
   - Adds `theme-{name}` class to `<html>`
   - Preloads theme CSS and Google Fonts
   - Prevents FOUC (Flash of Unstyled Content)

2. **Client Hydration**:
   - `ThemeInitializer` component runs
   - Syncs theme state with `next-themes`
   - Loads theme CSS if not already loaded

3. **Theme Switching**:
   - User selects theme via `ThemeCarousel` or `ThemeSwitcher`
   - Theme saved to localStorage
   - CSS file dynamically loaded/unloaded
   - Fonts preloaded for new theme

### Theme Configuration

Themes are defined in CSS files using CSS custom properties:

```css
/* Example: public/styles/themes/cyberpunk.css */
:root[class*="theme-cyberpunk"] {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 142 76% 36%;
  /* ... */
}
```

**Pattern**: Always use HSL color format in CSS variables for Tailwind compatibility.

### Font Management

Each theme can specify Google Fonts in the theme script (`layout.tsx`):

```javascript
var themeFonts = {
  "cyberpunk": ["Oxanium", "Source Code Pro"],
  "claude": [],
  // ...
};
```

Fonts are loaded dynamically when theme changes to avoid loading unused fonts.

## AI Summarization System

### Architecture Overview

The summarization system supports two backends:

1. **Chrome Summarizer API** (Chrome 138+)
   - Native browser API
   - Gemini Nano model
   - No model download required
   - Check availability: `Summarizer.availability()`

2. **Transformers.js** (Fallback/Default)
   - Local models run in browser
   - Web Worker for performance
   - Models cached in IndexedDB
   - Default: `distilbart-cnn-12-6`

### Summarization Flow

**Entry Point**: `src/lib/summarization.ts`

1. **Check Availability**:
   ```typescript
   const available = await isSummarizerAvailable();
   if (!available) {
     // Fall back to Transformers.js
   }
   ```

2. **Create Summarizer**:
   - Chrome API: `Summarizer.create({ type, length, format })`
   - Transformers.js: `summarizeWithTransformers()`

3. **Generate Summary**:
   - Extract text from HTML: `extractTextForSummary(html)`
   - Call summarization function
   - Cache result in article record

4. **Save to Database**:
   ```typescript
   await updateArticleSummary(
     articleId,
     summary,
     summaryType, // "tldr" | "key-points" | "teaser" | "headline"
     summaryLength // "short" | "medium" | "long" | "extended"
   );
   ```

### Summary Types & Lengths

- **Types**:
  - `tldr`: Quick summary
  - `key-points`: Bullet list
  - `teaser`: Engaging preview
  - `headline`: Single headline

- **Lengths**:
  - `short`: 1 sentence / 3 bullets
  - `medium`: 3 sentences / 5 bullets
  - `long`: 5 sentences / 7 bullets
  - `extended`: 7-10 sentences / 10+ bullets

### Transformers.js Integration

**Key Files**:
- `src/lib/summarization-transformers.ts`: Transformers.js wrapper
- `src/lib/summarization-worker.ts`: Web Worker for model execution
- `src/lib/summarization-models.ts`: Model configuration

**Pattern**: Models are loaded in Web Worker to avoid blocking main thread. Cache models in IndexedDB to avoid re-downloading.

### Translation Integration

Summaries can be auto-translated to Spanish:

```typescript
const result = await summarizeWithTransformers({
  text: articleContent,
  length: "extended",
  outputLanguage: "es", // Auto-translate to Spanish
});
```

Translation happens during summarization, not as separate step.

## Cache Management

### Model Caching

Transformers.js models are cached in IndexedDB:
- **Cache Key**: Model name + version
- **Cache Size**: Tracked via `getSummarizationCacheSize()`
- **Clear Cache**: `clearSummarizationModelCache()` (exposed in `CacheManager` component)

### Summary Caching

Article summaries are stored in article record:
- **Fields**: `summary`, `summaryType`, `summaryLength`, `summarizedAt`
- **Invalidation**: Clear when article is "unsaved" (`clearArticleScrapedContent`)

## Performance Considerations

1. **Lazy Loading**: `CacheManager` component lazy-loaded (heavy)
2. **Web Workers**: Transformers.js runs in worker to avoid blocking UI
3. **Model Preloading**: Optional preload for faster first summary
4. **Progress Tracking**: Show progress during model download/summarization

## Error Handling

- **Chrome API Unavailable**: Silently fall back to Transformers.js
- **Model Download Failure**: Show error, allow retry
- **Summarization Failure**: Show error toast, don't cache failed result
- **Insufficient Space**: Chrome API may require ~22GB free space (check error message)

## Usage Examples

### Generate Summary in Component

```typescript
import { useSummary } from "@/hooks/useSummary";

const { generateSummary, status, progress } = useSummary();

const handleSummarize = async () => {
  const result = await generateSummary({
    articleId: article.id,
    content: article.scrapedContent || article.content,
    length: "extended",
    type: "key-points",
  });
};
```

### Check Summarizer Availability

```typescript
import { isSummarizerAvailable } from "@/lib/summarization";

const available = await isSummarizerAvailable();
if (available) {
  // Use Chrome API
} else {
  // Use Transformers.js
}
```

