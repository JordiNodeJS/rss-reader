# ��� AI PROMPT: Instalar Nuevo Tema Shadcn en Sistema Multi-Tema

Cuando el usuario pida instalar un tema de tweakcn.com, sigue este proceso:

## CONTEXTO
Este proyecto usa un sistema multi-tema con **carga dinámica de CSS**:
- Los temas están en `public/styles/themes/` (NO en src/)
- Se cargan bajo demanda cuando el usuario los selecciona
- NO se importan en globals.css
- Usa estrategia "swap" para evitar flash de contenido sin estilos

## ��� MÉTODO A o B

**¿Cómo te dan el tema?**
- ��� **URL de tweakcn.com** → Usa MÉTODO A  
- ��� **Código CSS directo** → Usa MÉTODO B

---

## ��� MÉTODO A: Desde URL de Tweakcn.com

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
��� **Ubicación:** `public/styles/themes/NOMBRE-TEMA.css`

> ⚠️ **IMPORTANTE:** Los temas van en `public/` para carga dinámica, NO en `src/`

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

### 4️⃣ Registrar en `src/hooks/use-theme-config.ts`

**A) Añadir al type:**
```typescript
export type ThemeName = 
  | 'retro-arcade'
  | 'mocha-mousse'
  | 'amethyst-haze'
  | 'claude'
  | 'sage-garden'
  | 'tangerine'
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

### 5️⃣ Restaurar globals.css
**IMPORTANTE:** Deshacer los cambios que shadcn hizo a globals.css:
```bash
git checkout src/app/globals.css
```
↳ Los temas NO deben estar en globals.css (se cargan dinámicamente)

### 6️⃣ Verificar
```bash
pnpm dev
```
- Abrir sidebar → "Color Theme" → Nuevo tema debe aparecer
- Verificar en Network tab que el CSS se carga al hacer clic

---

## ��� MÉTODO B: Desde Código CSS Directo

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
��� **Ubicación:** `public/styles/themes/tangerine.css`

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

### 4️⃣ Registrar en `src/hooks/use-theme-config.ts`

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

### 5️⃣ Verificar
```bash
pnpm dev
```
- Abrir sidebar → "Color Theme" → El nuevo tema debe aparecer y funcionar
- Verificar en Network tab que carga dinámicamente

---

## ⚡ EJEMPLO RÁPIDO

**Usuario dice:** "Instala sunset-horizon"

**Tú haces:**
1. `pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/sunset-horizon.json`
2. Copiar vars de `globals.css` (secciones `:root` y `.dark`)
3. Crear `public/styles/themes/sunset-horizon.css`:
   ```css
   .theme-sunset-horizon { /* vars de :root */ }
   .theme-sunset-horizon.dark { /* vars de .dark */ }
   ```
4. Añadir a `src/hooks/use-theme-config.ts`:
   - Type: `'sunset-horizon'`
   - Array: `{ id: 'sunset-horizon', name: 'Sunset Horizon', colors: [...] }`
5. Restaurar globals.css: `git checkout src/app/globals.css`
6. Testear

---

## ��� REGLAS IMPORTANTES

### ✅ HACER:
- Usar kebab-case: `sunset-horizon` NO `sunsetHorizon`
- Guardar temas en `public/styles/themes/` (carga dinámica)
- Copiar **todas** las variables CSS (incluye fonts, shadows, spacing)
- Transformar `:root` → `.theme-nombre` y `.dark` → `.theme-nombre.dark`
- Añadir a **ambos**: TypeScript type Y array AVAILABLE_THEMES
- Restaurar globals.css después de instalar con shadcn
- Verificar carga dinámica en Network tab del navegador

### ❌ NO HACER:
- Guardar temas en `src/styles/themes/` (ubicación antigua)
- Importar temas en globals.css (ya no se usa `@import`)
- Editar manualmente `:root` o `.dark` en globals.css
- Olvidar la versión `.dark` del tema
- Usar espacios en el nombre del tema (usar guiones)
- Copiar la sección `@theme inline` a los archivos de temas

---

## ��� ARQUITECTURA DEL SISTEMA

```
public/styles/themes/           ← CSS de temas (carga dinámica via <link>)
├── retro-arcade.css
├── mocha-mousse.css
├── amethyst-haze.css
├── claude.css
├── sage-garden.css
└── tangerine.css

src/hooks/use-theme-config.ts   ← Registro de temas + estado (Zustand)
src/lib/theme-loader.ts         ← Cargador dinámico con estrategia swap
src/app/layout.tsx              ← Script bloqueante para carga inicial
```

### Cómo funciona la carga dinámica:
1. **Carga inicial:** Script en `layout.tsx` lee tema de localStorage y crea `<link>`
2. **Cambio de tema:** `theme-loader.ts` crea nuevo `<link>`, espera carga, elimina anterior
3. **Estrategia swap:** Nuevo CSS carga ANTES de eliminar el viejo (evita flash)

---

## ��� NOTAS

- Los warnings de `@custom-variant`, `@theme`, `@apply` en globals.css son normales (Tailwind v4)
- El tema se guarda automáticamente en LocalStorage (key: `rss-reader-theme-config`)
- Solo se persiste `currentTheme`, NO `isLoading` (gracias a `partialize`)
- Cada tema funciona con light/dark mode independientemente
- Los cambios son instantáneos (no requiere reload)

---

## ��� TROUBLESHOOTING

**Tema no aparece en UI:**
- Verificar que está en `AVAILABLE_THEMES` array
- Verificar que el type `ThemeName` incluye el nuevo tema

**Tema no se aplica:**
- Verificar que el archivo está en `public/styles/themes/`
- Verificar nombres de clase: `.theme-{name}` y `.theme-{name}.dark`
- Revisar Network tab por errores 404

**Botones de tema deshabilitados:**
- Limpiar localStorage: `localStorage.removeItem('rss-reader-theme-config')`
- El estado `isLoading` no debería persistirse

**Flash de contenido sin estilos:**
- La estrategia swap debería prevenirlo
- Verificar que `layout.tsx` tiene el script bloqueante

---

**RESUMEN:** Instalar → Copiar → Crear en public/ → Transformar a clase → Registrar → Restaurar globals → Testear
