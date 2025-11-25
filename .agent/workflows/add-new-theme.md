---
description: How to add a new shadcn theme to the multi-theme system
---

# Adding a New Theme from Tweakcn.com

This project uses a **multi-theme system** where multiple shadcn themes coexist without overwriting each other. Follow these steps exactly when the user asks to add a new theme.

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

- Confirm with `y` when prompted to overwrite CSS variables
- This will temporarily update `src/app/globals.css`

### Step 2: Extract Theme Variables
After installation, open `src/app/globals.css` and **copy** the generated CSS variables from:
- The `:root` section (light mode variables)
- The `.dark` section (dark mode variables)

### Step 3: Create Theme File
Create a new file in `src/styles/themes/` with the theme name:

```
src/styles/themes/sunset-horizon.css
```

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
- Replace `:root` with `.theme-{theme-name}`
- Replace `.dark` with `.theme-{theme-name}.dark`
- Use kebab-case for the theme name

### Step 5: Import Theme in globals.css
Open `src/app/globals.css` and add the import with the other theme imports:

```css
/* Import all theme CSS files */
@import '../styles/themes/retro-arcade.css';
@import '../styles/themes/mocha-mousse.css';
@import '../styles/themes/amethyst-haze.css';
@import '../styles/themes/claude.css';
@import '../styles/themes/sage-garden.css';
@import '../styles/themes/sunset-horizon.css'; /* NEW THEME */
```

### Step 6: Register Theme in Hook
Open `src/hooks/use-theme-config.ts` and:

1. **Add to TypeScript type:**
```typescript
export type ThemeName = 
  | 'retro-arcade'
  | 'mocha-mousse'
  | 'amethyst-haze'
  | 'claude'
  | 'sage-garden'
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
- Look at `--primary`, `--secondary`, and `--accent` in the theme file
- Convert oklch() values to hex (use a color picker or browser devtools)
- Add 3 representative colors

---

## METHOD B: From Direct CSS Code

Use this method when the user provides theme CSS code directly (not a URL).

### Step 1: Identify Theme Name
Ask the user for the theme name if not provided, or extract it from context.

Example: If they say "add tangerine theme", the name is `tangerine`.

### Step 2: Extract Variables from Provided Code
The user will provide CSS code containing:
- `:root { ... }` - Light mode variables
- `.dark { ... }` - Dark mode variables  
- `@theme inline { ... }` - **IGNORE THIS** (it's Tailwind v4 config, already in globals.css)

**Important:** Only use the `:root` and `.dark` sections. Discard `@theme inline`.

### Step 3: Create Theme File
Create `src/styles/themes/tangerine.css` (use kebab-case name)

### Step 4: Transform to Theme Classes
Take the provided `:root` and `.dark` content and transform:

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

### Step 5: Import in globals.css
Add to `src/app/globals.css` with other imports:

```css
@import '../styles/themes/tangerine.css';
```

### Step 6: Register in Hook
Same as METHOD A Step 6:

1. Add `'tangerine'` to `ThemeName` type
2. Add to `AVAILABLE_THEMES`:
   ```typescript
   {
     id: 'tangerine',
     name: 'Tangerine',
     colors: ['#e05d38', '#f3f4f6', '#d6e4f0'], // Use --primary, --secondary, --accent
   }
   ```

### Step 7: Test
Run `pnpm dev` and verify the theme appears and works correctly.

---

## Common Steps (Both Methods)

### Step 7 (METHOD A) / Step 8 (METHOD B): Restore Original Theme (Optional)
If you want to restore the previous default theme in `globals.css`:

```bash
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/retro-arcade.json
```

This restores retro-arcade to `:root` (though it's not strictly necessary since themes use classes now).

### Step 8: Test
1. Start the dev server: `pnpm dev`
2. Open the sidebar
3. Check that the new theme button appears in the "Color Theme" section
4. Click it to verify the theme applies correctly

## Important Notes

⚠️ **DO NOT:**
- Manually edit the `:root` or `.dark` sections in `globals.css` after adding themes
- Delete the theme files in `src/styles/themes/` - they're all needed
- Forget to add BOTH light and dark mode variables

✅ **DO:**
- Keep theme files organized in `src/styles/themes/`
- Use descriptive preview colors that represent the theme
- Test in both light and dark mode
- Follow the exact naming convention: `theme-{kebab-case-name}`

## Quick Reference

**Theme name format:** `sunset-horizon` (kebab-case, all lowercase)  
**CSS class:** `.theme-sunset-horizon`  
**File location:** `src/styles/themes/sunset-horizon.css`  
**Display name:** `Sunset Horizon` (Title Case for UI)

## Example Complete Flow

```bash
# 1. Install theme
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/sunset-horizon.json

# 2. Copy variables from src/app/globals.css
# 3. Create src/styles/themes/sunset-horizon.css
# 4. Transform :root → .theme-sunset-horizon
# 5. Add import to globals.css
# 6. Add to use-theme-config.ts types and array
# 7. Test in browser
```

## Troubleshooting

**Theme doesn't appear in UI:**
- Check that you added it to `AVAILABLE_THEMES` array
- Verify the `ThemeName` type includes the new theme
- Check browser console for errors

**Theme doesn't apply:**
- Verify CSS class name matches: `.theme-{name}` and `.theme-{name}.dark`
- Check that the import in `globals.css` is correct
- Clear browser cache and restart dev server

**Colors look wrong:**
- Make sure you copied ALL variables from both `:root` and `.dark`
- Verify you didn't miss any `--font-*` or `--shadow-*` variables
- Check for typos in variable names
