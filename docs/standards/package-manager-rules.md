# Package Manager Rules

## Gestor de Paquetes Oficial

**IMPORTANTE**: Este proyecto utiliza **pnpm** como gestor de paquetes oficial.

### Reglas obligatorias:

1. **Instalación de dependencias**: Usar siempre `pnpm install` o `pnpm i`
   ```bash
   pnpm install
   # NO usar: npm install, yarn install, bun install
   ```

2. **Agregar dependencias**: Usar `pnpm add`
   ```bash
   pnpm add <package-name>
   pnpm add -D <package-name>  # para dev dependencies
   ```

3. **Ejecutar scripts**: Usar `pnpm` para ejecutar scripts del package.json
   ```bash
   pnpm dev
   pnpm build
   pnpm lint
   ```

4. **Ejecutar paquetes sin instalar**: Usar `pnpm dlx` (equivalente a `npx`)
   ```bash
   pnpm dlx <package-name>
   # Ejemplo: pnpm dlx create-next-app@latest
   ```

### Razones para usar pnpm:

- **Eficiencia de espacio**: pnpm usa un almacén de contenido direccionable que ahorra espacio en disco
- **Velocidad**: Instalaciones más rápidas que npm o yarn
- **Seguridad**: Estructura de node_modules más estricta que previene acceso a dependencias no declaradas
- **Consistencia**: Garantiza que todos los desarrolladores usen las mismas versiones

### Archivos importantes:

- `pnpm-lock.yaml`: Archivo de bloqueo de versiones (equivalente a package-lock.json)
  - **NUNCA** eliminar este archivo
  - **SIEMPRE** commitear cambios en este archivo

### Instalación de pnpm:

Si no tienes pnpm instalado:

```bash
# Windows (PowerShell)
iwr https://get.pnpm.io/install.ps1 -useb | iex

# O usando npm (una sola vez)
npm install -g pnpm

# Verificar instalación
pnpm --version
```

### Comandos comunes:

```bash
# Instalar todas las dependencias
pnpm install

# Agregar una dependencia
pnpm add <package>

# Agregar una dependencia de desarrollo
pnpm add -D <package>

# Actualizar dependencias
pnpm update

# Ejecutar script
pnpm <script-name>

# Ejecutar comando sin instalar
pnpm dlx <command>

# Limpiar caché
pnpm store prune
```

### ⚠️ NO HACER:

- ❌ NO usar `npm install`
- ❌ NO usar `yarn install`
- ❌ NO usar `bun install`
- ❌ NO mezclar gestores de paquetes
- ❌ NO eliminar `pnpm-lock.yaml`

### Para AI Agents (Antigravity, Cursor, etc.):

Cuando generes comandos o sugerencias para este proyecto:
- **SIEMPRE** usa `pnpm` en lugar de `npm`, `yarn` o `bun`
- **SIEMPRE** usa `pnpm dlx` en lugar de `npx`
- **NUNCA** sugieras instalar paquetes con otros gestores
- Si necesitas ejecutar un script, usa `pnpm <script-name>`
