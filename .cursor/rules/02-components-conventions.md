---
description: Component patterns, UI conventions, and code style guidelines
alwaysApply: true
---

# Component Patterns & Conventions

## Component Structure

### File Organization

- **Components**: `src/components/` (organized by feature)
- **Hooks**: `src/hooks/` (custom React hooks)
- **Lib**: `src/lib/` (utilities, database, services)
- **UI Components**: `src/components/ui/` (Shadcn UI primitives)

### Client Component Pattern

All interactive components must use `"use client"` directive:

```typescript
"use client";

import { useState } from "react";
// Component code...
```

**Exception**: Server components in `app/` directory (page.tsx, layout.tsx) are server components by default.

## Custom Hooks Pattern

Business logic lives in custom hooks, not in components:

- **`useFeeds`**: Feed CRUD operations, RSS fetching, article management
- **`useSummary`**: AI summarization with progress tracking
- **`useTranslation`**: Article translation to Spanish
- **`useIsClient`**: Hydration safety check

**Pattern**: Hooks return state + functions. Components are presentational.

Example:
```typescript
// Hook handles logic
const { feeds, articles, addNewFeed, removeFeed } = useFeeds();

// Component handles UI
<Button onClick={() => addNewFeed(url)}>Add Feed</Button>
```

## Shadcn UI Components

All UI primitives from Shadcn UI are in `src/components/ui/`. Usage patterns:

- **Dialog**: Modal dialogs (`Dialog`, `DialogContent`, `DialogHeader`)
- **Sheet**: Mobile sidebar/drawer
- **Button**: Use variants (`default`, `ghost`, `outline`, `secondary`, `destructive`)
- **Select**: Dropdowns with grouped options
- **ScrollArea**: Custom scrollable containers
- **Collapsible**: Expandable sections (used for feed categories)

**Pattern**: Import from `@/components/ui/*`, use Radix UI props directly.

## State Management

- **Local State**: `useState` for component-specific state
- **Persistent State**: IndexedDB via `src/lib/db.ts` functions
- **Theme State**: `next-themes` + localStorage
- **No Global State**: No Zustand/Redux (only used for theme persistence in one case)

**Pattern**: Fetch from IndexedDB on mount, update local state, sync to IndexedDB on changes.

## Error Handling in Components

1. **User Errors**: Catch `UserError`, show toast, log as `warn`
2. **Network Errors**: Show helpful message with retry suggestion
3. **Validation Errors**: Show inline or toast with specific field

Example from `useFeeds.ts`:
```typescript
try {
  await addNewFeed(url);
} catch (error) {
  if (error instanceof UserError) {
    console.warn(error.message); // User-facing, don't log as error
    toast.error(error.message);
  } else {
    console.error(error); // Developer error
    toast.error("Failed to add feed");
  }
}
```

## Activity Status Pattern

Use `ActivityStatusContext` for long-running operations:

```typescript
const { setActivity, clearActivity } = useActivityStatus();

setActivity("fetching-rss", "Fetching feed...");
try {
  // Operation
} finally {
  clearActivity();
}
```

Activity types: `"fetching-rss"`, `"scraping"`, `"saving"`, `"translating"`, `"error"`

## Image Handling

- **RSS Images**: Extracted from multiple sources (enclosure, media:content, content:encoded)
- **Validation**: Use `isValidImageUrl()` from `src/lib/utils.ts`
- **Optimization**: Scraped images converted to WebP base64 (in API route)
- **Placeholders**: Use `public/article-placeholder.svg` for missing images

## Accessibility Patterns

- **Visually Hidden**: Use `VisuallyHidden` component for screen reader text
- **ARIA Labels**: Add `aria-label` to icon-only buttons
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Focus Management**: Dialogs trap focus

## Animation & Transitions

- **GSAP**: Used for complex animations (see `FlipTextReveal.tsx`)
- **CSS Transitions**: Tailwind transition classes for simple animations
- **Collapsible**: Uses `data-[state=open]:animate-collapsible-down` pattern

## Drag & Drop

Uses `@dnd-kit` for feed reordering:

- **Sensors**: Pointer + Keyboard for accessibility
- **Activation**: 8px drag distance to prevent accidental drags
- **Visual Feedback**: Opacity 0.5 while dragging
- **Persistence**: Order saved to IndexedDB immediately

## Responsive Design

- **Mobile**: Sheet-based sidebar, touch-friendly targets
- **Desktop**: Fixed resizable sidebar (260-600px)
- **Breakpoints**: Tailwind defaults (md: 768px)
- **Sidebar Width**: Persisted in localStorage + cookie for SSR

## Code Style Conventions

1. **Imports**: Group by type (React, third-party, local)
2. **Types**: Define interfaces near usage, export from `lib/db.ts` for shared types
3. **Comments**: Use JSDoc for complex functions
4. **Naming**: 
   - Components: PascalCase
   - Hooks: camelCase starting with `use`
   - Functions: camelCase
   - Constants: UPPER_SNAKE_CASE

## Testing Considerations

- **E2E Tests**: Playwright (see `pnpm dlx playwright test`)
- **No Unit Tests**: Currently no test suite (focus on E2E)
- **Manual Testing**: Use browser dev tools for IndexedDB inspection

