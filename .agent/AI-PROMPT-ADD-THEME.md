# 🎨 AI PROMPT: Instalar Nuevo Tema Shadcn en Sistema Multi-Tema

Cuando el usuario pida instalar un tema de tweakcn.com, sigue este proceso:

## CONTEXTO
Este proyecto usa un sistema multi-tema donde cada tema tiene su propia clase CSS (`.theme-nombre`) en lugar de sobrescribir `:root`. Los temas coexisten y se cambian dinámicamente.

## 🔀 MÉTODO A o B

**¿Cómo te dan el tema?**
- 📦 **URL de tweakcn.com** → Usa MÉTODO A  
- 📝 **Código CSS directo** → Usa MÉTODO B

## 📋 MÉTODO A: Desde URL de Tweakcn.com

### 1️⃣ Instalar el tema temporalmente
```bash
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/NOMBRE-TEMA.json
```
↳ Acepta con `y` cuando pregunte si sobrescribir

### 2️⃣ Extraer variables de `src/app/globals.css`
Copiar TODO el contenido de:
- Sección `:root { ... }`
- Sección `.dark { ... }`

### 3️⃣ Crear archivo de tema
Crear: `src/styles/themes/NOMBRE-TEMA.css`

Pegar las variables copiadas pero TRANSFORMARLAS:
```css
/* Nombre del Tema */
.theme-nombre-tema {
  /* Pegar aquí TODO el contenido de :root */
}

.theme-nombre-tema.dark {
  /* Pegar aquí TODO el contenido de .dark */
}
```

### 4️⃣ Importar en `src/app/globals.css`
Añadir al inicio con los otros imports:
```css
@import '../styles/themes/nombre-tema.css';
```

### 5️⃣ Registrar en `src/hooks/use-theme-config.ts`

**A) Añadir al type:**
```typescript
export type ThemeName = 
  | 'retro-arcade'
  | 'mocha-mousse'
  | /* ... otros */
  | 'nombre-tema'; // ← NUEVO
```

**B) Añadir a AVAILABLE_THEMES:**
```typescript
{
  id: 'nombre-tema',
  name: 'Nombre Tema',
  colors: ['#hex1', '#hex2', '#hex3'], // 3 colores representativos del tema
},
```

### 6️⃣ Verificar
```bash
pnpm dev
```

---

## 📝 MÉTODO B: Desde Código CSS Directo

Usa este método cuando te dan el CSS directamente (no URL).

### 1️⃣ Identificar el nombre del tema
Pregunta al usuario si no está claro. Ejemplo: "tangerine"

### 2️⃣ Extraer SOLO `:root` y `.dark`
**Del código proporcionado:**
```css
:root { --background: #e8ebed; ... }
.dark { --background: #1c2433; ... }
@theme inline { ... } ← ❌ IGNORAR ESTO
```

**⚠️ IMPORTANTE:** Descarta completamente la sección `@theme inline` (ya existe en globals.css)

### 3️⃣ Crear archivo de tema
Crear: `src/styles/themes/tangerine.css`

Transformar el código proporcionado:
```css
/* Tangerine Theme */
.theme-tangerine {
  --background: #e8ebed;
  --foreground: #333333;
  --primary: #e05d38;
  /* ... TODO el contenido de :root */
}

.theme-tangerine.dark {
  --background: #1c2433;
  --foreground: #e5e5e5;
  --primary: #e05d38;
  /* ... TODO el contenido de .dark */
}
```

### 4️⃣ Importar en `src/app/globals.css`
```css
@import '../styles/themes/tangerine.css';
```

### 5️⃣ Registrar en `src/hooks/use-theme-config.ts`

**A) Añadir al type:**
```typescript
| 'tangerine'; // ← NUEVO
```

**B) Añadir a AVAILABLE_THEMES:**
```typescript
{
  id: 'tangerine',
  name: 'Tangerine',
  colors: ['#e05d38', '#f3f4f6', '#d6e4f0'], // Usar --primary, --secondary, --accent
}
```

### 6️⃣ Verificar
```bash
pnpm dev
```
Abrir sidebar → "Color Theme" → El nuevo tema debe aparecer y funcionar

---

## ⚡ EJEMPLO RÁPIDO

**Usuario dice:** "Instala sunset-horizon"

**Tú haces:**
1. `pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/sunset-horizon.json`
2. Copiar vars de `globals.css`
3. Crear `src/styles/themes/sunset-horizon.css`:
   ```css
   .theme-sunset-horizon { /* vars de :root */ }
   .theme-sunset-horizon.dark { /* vars de .dark */ }
   ```
4. Importar en `globals.css`: `@import '../styles/themes/sunset-horizon.css';`
5. Añadir a `use-theme-config.ts`:
   - Type: `'sunset-horizon'`
   - Array: `{ id: 'sunset-horizon', name: 'Sunset Horizon', colors: [...] }`
6. Testear

### Ejemplo MÉTODO B: Código CSS Directo

**Usuario dice:** "Añade el tema tangerine con este código: [pega CSS]"

**Tú haces:**
1. Identificar que el código tiene `:root` y `.dark` (ignorar `@theme inline`)
2. Crear `src/styles/themes/tangerine.css`
3. Transformar:
   ```css
   .theme-tangerine { /* copiar :root */ }
   .theme-tangerine.dark { /* copiar .dark */ }
   ```
4. Importar en `globals.css`: `@import '../styles/themes/tangerine.css';`
5. Añadir a `use-theme-config.ts`:
   - Type: `'tangerine'`
   - Array: `{ id: 'tangerine', name: 'Tangerine', colors: ['#e05d38', '#f3f4f6', '#d6e4f0'] }`
6. Testear

---

## 🚨 REGLAS IMPORTANTES

✅ USAR kebab-case: `sunset-horizon` NO `sunsetHorizon`  
✅ COPIAR **todas** las variables CSS (incluye fonts, shadows, spacing)  
✅ TRANSFORMAR `:root` → `.theme-nombre` y `.dark` → `.theme-nombre.dark`  
✅ AÑADIR a ambos: TypeScript type Y array AVAILABLE_THEMES  
✅ Si hay `@theme inline` en el código: **IGNORARLO completamente**

❌ NO editar manualmente `:root` o `.dark` en globals.css  
❌ NO olvidar la versión `.dark` del tema  
❌ NO usar espacios en el nombre del tema (usar guiones)
❌ NO copiar la sección `@theme inline` a los archivos de temas

## 💡 NOTAS

- Los warnings de `@custom-variant`, `@theme`, `@apply` en globals.css son normales (Tailwind v4)
- El tema se guarda automáticamente en LocalStorage
- Cada tema funciona con light/dark mode independientemente
- Los cambios son instantáneos (no requiere reload)

---

**RESUMEN:** Instalar → Copiar → Transformar a clase → Importar → Registrar → Testear
