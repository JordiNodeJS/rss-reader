---
description: Uso obligatorio de pnpm y pnpm dlx como gestor de paquetes
alwaysApply: true
---

# Gestión de paquetes

**IMPORTANTE**: Siempre utiliza `pnpm` como gestor de paquetes. Nunca uses `npm` o `yarn`.

- Para instalar dependencias: `pnpm install`
- Para ejecutar comandos con herramientas externas: `pnpm dlx` (en lugar de `npx`)
- Para ejecutar scripts del package.json: `pnpm run <script>`
- Para añadir dependencias: `pnpm add <package>`
- Para añadir dependencias de desarrollo: `pnpm add -D <package>`

Ejemplos:
- ✅ `pnpm dlx next dev` (correcto)
- ❌ `npx next dev` (incorrecto)
- ✅ `pnpm install` (correcto)
- ❌ `npm install` (incorrecto)

