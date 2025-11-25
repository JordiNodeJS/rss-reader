---
description: How to add a new shadcn theme to the multi-theme system
---

# Adding a New Theme from Tweakcn.com

This project uses a **multi-theme system** with **dynamic CSS loading**. Theme CSS files are loaded on-demand when selected, reducing initial bundle size. Follow these steps exactly when the user asks to add a new theme.

## Architecture Overview

```
public/styles/themes/          ← Theme CSS files (loaded dynamically via <link>)
├── retro-arcade.css
├── mocha-mousse.css
├── amethyst-haze.css
├── claude.css
├── sage-garden.css
└── tangerine.css

src/hooks/use-theme-config.ts  ← Theme registry and state management
src/lib/theme-loader.ts        ← Dynamic CSS loader with swap strategy
src/app/layout.tsx             ← Initial theme loading (blocking script)
```

## Example User Requests

### Option A: From Tweakcn.com URL
```
Install the sunset-horizon theme:
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/sunset-horizon.json
```

### Option B: From Direct CSS Code
```
Add the tangerine theme with this code:
:root { --background: #e8ebed; ... }
.dark { --background: #1c2433; ... }
@theme inline { ... }
```

## Step-by-Step Process

> **Note:** Choose the appropriate method based on how the theme is provided.

---

## METHOD A: Installing from Tweakcn.com URL

### Step 1: Install the Theme Temporarily
Run the shadcn command to install the theme:

```bash
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/sunset-horizon.json
```

- Confirm with \`y\` when prompted to overwrite CSS variables
- This will temporarily update \`src/app/globals.css\`

### Step 2: Extract Theme Variables
After installation, open \`src/app/globals.css\` and **copy** the generated CSS variables from:
- The \`:root\` section (light mode variables)
- The \`.dark\` section (dark mode variables)

### Step 3: Create Theme File
Create a new file in \`public/styles/themes/\` with the theme name:

```
public/styles/themes/sunset-horizon.css
```

> ⚠️ **IMPORTANT:** Theme files go in \`public/styles/themes/\` (NOT \`src/styles/themes/\`)
> This enables dynamic loading at runtime without bundling.

### Step 4: Convert to Theme Class
Paste the copied variables and **transform** them:

**From this (what shadcn generates):**
```css
:root {
  --radius: 0.5rem;
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... more variables */
}

.dark {
  --background: oklch(...);
  /* ... dark mode variables */
}
```

**To this (multi-theme format):**
```css
/* Sunset Horizon Theme */
.theme-sunset-horizon {
  --radius: 0.5rem;
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... all the same variables */
}

.theme-sunset-horizon.dark {
  --background: oklch(...);
  /* ... all the same dark variables */
}
```

**Key changes:**
- Replace \`:root\` with \`.theme-{theme-name}\`
- Replace \`.dark\` with \`.theme-{theme-name}.dark\`
- Use kebab-case for the theme name

### Step 5: Register Theme in Hook
Open \`src/hooks/use-theme-config.ts\` and:

1. **Add to TypeScript type:**
```typescript
export type ThemeName = 
  | 'retro-arcade'
  | 'mocha-mousse'
  | 'amethyst-haze'
  | 'claude'
  | 'sage-garden'
  | 'tangerine'
  | 'sunset-horizon'; // NEW
```

2. **Add to AVAILABLE_THEMES array:**
```typescript
export const AVAILABLE_THEMES: ThemeConfig[] = [
  // ... existing themes
  {
    id: 'sunset-horizon',
    name: 'Sunset Horizon',
    colors: ['#color1', '#color2', '#color3'], // Extract from theme
  },
];
```

**To find preview colors:**
- Look at \`--primary\`, \`--secondary\`, and \`--accent\` in the theme file
- Convert oklch() values to hex (use a color picker or browser devtools)
- Add 3 representative colors

### Step 6: Restore globals.css (Important!)
**Undo the shadcn changes to globals.css** - the theme should NOT be in globals.css.

Either:
- Git restore: \`git checkout src/app/globals.css\`
- Or manually remove the \`:root\` and \`.dark\` sections that shadcn added

> ⚠️ globals.css should only contain \`@import "tailwindcss"\`, \`@theme inline\`, and base styles.
> Individual themes are NOT imported here - they load dynamically.

### Step 7: Test
1. Start the dev server: \`pnpm dev\`
2. Open the sidebar
3. Check that the new theme button appears in the "Color Theme" section
4. Click it to verify the theme applies correctly
5. Check Network tab - theme CSS should load on-demand

---

## METHOD B: From Direct CSS Code

Use this method when the user provides theme CSS code directly (not a URL).

### Step 1: Identify Theme Name
Ask the user for the theme name if not provided, or extract it from context.

Example: If they say "add tangerine theme", the name is \`tangerine\`.

### Step 2: Extract Variables from Provided Code
The user will provide CSS code containing:
- \`:root { ... }\` - Light mode variables
- \`.dark { ... }\` - Dark mode variables  
- \`@theme inline { ... }\` - **IGNORE THIS** (it's Tailwind v4 config, already in globals.css)

**Important:** Only use the \`:root\` and \`.dark\` sections. Discard \`@theme inline\`.

### Step 3: Create Theme File
Create \`public/styles/themes/tangerine.css\` (use kebab-case name)

> ⚠️ **IMPORTANT:** File goes in \`public/styles/themes/\` for dynamic loading!

### Step 4: Transform to Theme Classes
Take the provided \`:root\` and \`.dark\` content and transform:

**From (provided code):**
```css
:root {
  --background: #e8ebed;
  --foreground: #333333;
  --primary: #e05d38;
  /* ... all variables */
}

.dark {
  --background: #1c2433;
  --foreground: #e5e5e5;
  --primary: #e05d38;
  /* ... all variables */
}
```

**To (theme file):**
```css
/* Tangerine Theme */
.theme-tangerine {
  --background: #e8ebed;
  --foreground: #333333;
  --primary: #e05d38;
  /* ... paste ALL variables from :root */
}

.theme-tangerine.dark {
  --background: #1c2433;
  --foreground: #e5e5e5;
  --primary: #e05d38;
  /* ... paste ALL variables from .dark */
}
```

### Step 5: Register in Hook
Same as METHOD A Step 5:

1. Add \`'tangerine'\` to \`ThemeName\` type
2. Add to \`AVAILABLE_THEMES\`:
   ```typescript
   {
     id: 'tangerine',
     name: 'Tangerine',
     colors: ['#e05d38', '#f3f4f6', '#d6e4f0'], // Use --primary, --secondary, --accent
   }
   ```

### Step 6: Test
Run \`pnpm dev\` and verify the theme appears and works correctly.

---

## How Dynamic Loading Works

The theme system uses a **swap strategy** to avoid flash of unstyled content:

1. **Initial Load** (\`src/app/layout.tsx\`):
   - A blocking \`<script>\` reads the saved theme from localStorage
   - Creates a \`<link id="dynamic-theme-link">\` pointing to the theme CSS
   - Applies theme classes to \`<html>\` before React hydrates

2. **Theme Change** (\`src/lib/theme-loader.ts\`):
   - Creates a NEW \`<link>\` element with the new theme
   - Waits for it to fully load (onload event)
   - Only THEN removes the old \`<link>\` and updates classes
   - This prevents the "flash" between themes

3. **State Management** (\`src/hooks/use-theme-config.ts\`):
   - Zustand store with \`persist\` middleware
   - Only \`currentTheme\` is persisted (not \`isLoading\`)
   - \`partialize\` option excludes transient state from localStorage

---

## Important Notes

⚠️ **DO NOT:**
- Put theme files in \`src/styles/themes/\` (old location, no longer used)
- Import theme CSS files in \`globals.css\` (they load dynamically now)
- Manually edit \`:root\` or \`.dark\` sections in globals.css
- Delete the theme files in \`public/styles/themes/\`
- Forget to add BOTH light and dark mode variables

✅ **DO:**
- Keep theme files in \`public/styles/themes/\`
- Use descriptive preview colors that represent the theme
- Test in both light and dark mode
- Follow the exact naming convention: \`theme-{kebab-case-name}\`
- Verify theme loads in Network tab (should see CSS request)

## Quick Reference

**Theme name format:** \`sunset-horizon\` (kebab-case, all lowercase)  
**CSS class:** \`.theme-sunset-horizon\`  
**File location:** \`public/styles/themes/sunset-horizon.css\`  
**Display name:** \`Sunset Horizon\` (Title Case for UI)

## Example Complete Flow

```bash
# 1. Install theme (temporary)
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/sunset-horizon.json

# 2. Copy variables from src/app/globals.css (the :root and .dark sections)

# 3. Create public/styles/themes/sunset-horizon.css
#    Transform :root → .theme-sunset-horizon
#    Transform .dark → .theme-sunset-horizon.dark

# 4. Add to src/hooks/use-theme-config.ts:
#    - ThemeName type
#    - AVAILABLE_THEMES array

# 5. Restore globals.css (undo shadcn changes)
git checkout src/app/globals.css

# 6. Test in browser - verify dynamic loading in Network tab
pnpm dev
```

## Troubleshooting

**Theme doesn't appear in UI:**
- Check that you added it to \`AVAILABLE_THEMES\` array
- Verify the \`ThemeName\` type includes the new theme
- Check browser console for errors

**Theme doesn't apply:**
- Verify CSS file exists in \`public/styles/themes/\`
- Check CSS class name matches: \`.theme-{name}\` and \`.theme-{name}.dark\`
- Look at Network tab - is the CSS file loading?
- Check for 404 errors

**Colors look wrong:**
- Make sure you copied ALL variables from both \`:root\` and \`.dark\`
- Verify you didn't miss any \`--font-*\` or \`--shadow-*\` variables
- Check for typos in variable names

**Flash of unstyled content:**
- The swap strategy should prevent this
- Check that \`layout.tsx\` has the blocking script
- Verify \`theme-loader.ts\` is using the swap strategy

**Theme buttons stay disabled:**
- Clear localStorage: \`localStorage.removeItem('rss-reader-theme-config')\`
- The \`partialize\` option should prevent \`isLoading\` from being persisted
