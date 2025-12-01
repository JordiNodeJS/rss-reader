# Package Manager Rules - pnpm

## REGLA OBLIGATORIA: Usar pnpm exclusivamente

Este proyecto **SOLO** utiliza `pnpm` como gestor de paquetes. **NUNCA** uses `npm`, `yarn` o `bun`.

## Comandos permitidos

### ✅ CORRECTO - Usar pnpm

```bash
# Instalar dependencias
pnpm install
pnpm i

# Agregar paquetes
pnpm add <package>
pnpm add -D <package>

# Ejecutar scripts
pnpm dev
pnpm build
pnpm lint
pnpm test

# Ejecutar comandos sin instalar (equivalente a npx)
pnpm dlx <command>
pnpm dlx playwright install
pnpm dlx create-next-app@latest

# Actualizar dependencias
pnpm update
pnpm up

# Remover paquetes
pnpm remove <package>
```

### ❌ INCORRECTO - NO usar estos comandos

```bash
# ❌ NO HACER
npm install
npm i
npm add
npm run dev
npx <command>

# ❌ NO HACER
yarn install
yarn add
yarn dev

# ❌ NO HACER
bun install
bun add
bunx <command>
```

## Reglas para AI Agents

Cuando generes código, sugerencias o comandos para este proyecto:

1. **SIEMPRE** usa `pnpm` en lugar de `npm`, `yarn` o `bun`
2. **SIEMPRE** usa `pnpm dlx` en lugar de `npx`, `yarn dlx` o `bunx`
3. **NUNCA** sugieras instalar paquetes con otros gestores
4. **NUNCA** generes comandos con `npm run`, usa `pnpm` directamente
5. Si el usuario menciona `npm` o `yarn`, corrige automáticamente a `pnpm`

## Ejemplos de conversión

| ❌ Comando incorrecto | ✅ Comando correcto |
|----------------------|---------------------|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm dev` |
| `npm add lodash` | `pnpm add lodash` |
| `npx playwright test` | `pnpm dlx playwright test` |
| `npm install -g <pkg>` | `pnpm add -g <pkg>` |
| `yarn workspace` | `pnpm -r` (recursive) |

## Archivos importantes

- `pnpm-lock.yaml` - Archivo de bloqueo de versiones
  - **NUNCA** eliminar
  - **SIEMPRE** commitear cambios
  - Equivalente a `package-lock.json` o `yarn.lock`

## Verificación

Si necesitas verificar que pnpm está instalado:

```bash
pnpm --version
```

Si no está instalado, instalar con:

```bash
npm install -g pnpm
```

(Esta es la **única** vez que se permite usar `npm` en este proyecto)

## Razones para usar pnpm

- **Eficiencia de espacio**: pnpm usa un almacén de contenido direccionable que ahorra espacio en disco
- **Velocidad**: Instalaciones más rápidas que npm o yarn
- **Seguridad**: Estructura de node_modules más estricta que previene acceso a dependencias no declaradas
- **Consistencia**: Garantiza que todos los desarrolladores usen las mismas versiones

## Referencias

- [Documentación oficial de pnpm](https://pnpm.io/)
- [Migración desde npm](https://pnpm.io/cli/import)
- [Comparativa de gestores de paquetes](https://pnpm.io/benchmarks)
