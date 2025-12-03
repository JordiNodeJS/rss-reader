# Reglas para Agentes de AI en Cursor

## ⚠️ Importante: Ubicación de este Documento

**Este archivo es documentación para desarrolladores humanos**, no una regla activa para el agente de AI.

- **Ubicación actual**: `docs/cursor-agent-rules.md` (documentación)
- **Para que el agente lo lea automáticamente**: Debe estar en `.cursor/rules/` con extensión `.mdc` o `.md`
- **Alternativa**: Se ha creado `.cursor/rules/documentation-reference.mdc` que referencia este documento

## Introducción

Las reglas para agentes de AI en Cursor son instrucciones persistentes y reutilizables que proporcionan contexto a los modelos de IA. Estas reglas guían la generación de código, la interpretación de ediciones y mejoran la consistencia del proyecto. Este documento explica la ubicación, formato y aplicación de estas reglas según la documentación oficial de Cursor.

## Ubicación de las Reglas

Cursor soporta múltiples ubicaciones para definir reglas de agentes de AI:

### 1. Directorio `.cursor/rules`

**Ubicación**: `.cursor/rules/` en la raíz del proyecto

**Características**:
- Cada regla es un archivo individual
- Las reglas están bajo control de versiones (se pueden commitear en Git)
- Permiten aplicar reglas globales o específicas a ciertas partes del código mediante patrones de ruta
- Formato recomendado: archivos `.mdc` (Markdown con metadatos)

**Estructura recomendada**:
```
.cursor/
  └── rules/
      ├── architecture.mdc
      ├── code-style.mdc
      └── project-specific.mdc
```

### 2. Archivo `AGENTS.md`

**Ubicación**: `AGENTS.md` en la raíz del proyecto

**Características**:
- Archivo único en formato Markdown
- Alternativa sencilla al directorio `.cursor/rules`
- Se aplica globalmente a todo el proyecto
- No admite subdirectorios ni múltiples archivos

**Limitaciones**:
- Debe ubicarse en la raíz del proyecto
- No puede dividirse en múltiples archivos
- Las instrucciones se aplican globalmente sin patrones de ruta

### 3. Reglas de Usuario (Globales)

**Ubicación**: Configuración de Cursor (preferencias globales)

**Características**:
- Preferencias globales definidas en la configuración de Cursor
- Se aplican a todos los proyectos del usuario
- No están bajo control de versiones del proyecto

## Formato de las Reglas

### Formato MDC (Markdown con Metadatos)

El formato MDC (`.mdc`) es el formato recomendado para las reglas en el directorio `.cursor/rules`. Permite incluir metadatos en formato YAML frontmatter y contenido en Markdown.

#### Estructura de un archivo `.mdc`:

```mdc
---
description: "Descripción breve de la regla"
globs: ["src/**/*.ts", "src/**/*.tsx"]
alwaysApply: true
---

# Título de la Regla

Contenido de la regla en formato Markdown.

## Sección 1

- Punto 1
- Punto 2

## Sección 2

Más contenido...
```

#### Propiedades de Metadatos:

- **`description`** (opcional): Descripción breve de la regla que aparece en la interfaz de Cursor
- **`globs`** (opcional): Array de patrones de ruta que determinan cuándo se aplica la regla
  - Ejemplo: `["src/**/*.ts"]` aplica la regla solo a archivos TypeScript en `src/`
  - Si se omite, la regla se aplica globalmente
- **`alwaysApply`** (opcional, boolean): Si es `true`, la regla siempre está activa, incluso si no coincide con los archivos abiertos

### Formato Markdown Simple

Para el archivo `AGENTS.md` o archivos `.md` en `.cursor/rules/`, se usa Markdown estándar sin metadatos:

```markdown
# Reglas del Proyecto

## Estilo de Código
- Utilizar TypeScript para todos los archivos nuevos
- Preferir componentes funcionales en React
- Usar snake_case para las columnas de la base de datos

## Arquitectura
- Seguir el patrón de componentes en `src/components/`
- Estado global en `src/store/`
```

## Aplicación de las Reglas

### Cuándo se Aplican

Las reglas se aplican en los siguientes contextos:

1. **Chat con el Agente**: Las reglas activas proporcionan contexto al modelo durante las conversaciones
2. **Edición en Línea**: Las reglas guían las sugerencias y ediciones automáticas
3. **Generación de Código**: Las reglas influyen en cómo el agente genera nuevo código

### Visualización de Reglas Activas

- Las reglas activas se muestran en la barra lateral del agente en Cursor
- Puedes ver qué reglas están aplicándose en cada momento
- Las reglas se filtran automáticamente según los archivos abiertos y los patrones `globs`

### Prioridad de Aplicación

1. **Reglas específicas por ruta** (con `globs` que coinciden con archivos abiertos)
2. **Reglas con `alwaysApply: true`**
3. **Reglas globales** (sin `globs` o en `AGENTS.md`)
4. **Reglas de usuario** (configuración global de Cursor)

## Ejemplos de Uso

### Ejemplo 1: Regla Específica para TypeScript

**Archivo**: `.cursor/rules/typescript-style.mdc`

```mdc
---
description: "Estilo de código TypeScript"
globs: ["src/**/*.ts", "src/**/*.tsx"]
alwaysApply: false
---

# Estilo TypeScript

- Usar tipos explícitos en lugar de `any`
- Preferir interfaces sobre tipos para objetos
- Usar `const` para valores inmutables
- Preferir arrow functions para callbacks
```

### Ejemplo 2: Regla Global de Arquitectura

**Archivo**: `.cursor/rules/architecture.mdc`

```mdc
---
description: "Arquitectura del proyecto"
alwaysApply: true
---

# Arquitectura del Proyecto

## Estructura de Carpetas
- Componentes en `src/components/`
- Hooks personalizados en `src/hooks/`
- Estado global en `src/store/`
- Utilidades en `src/utils/`

## Patrones Principales
- React Three Fiber para renderizado 3D
- Zustand para gestión de estado
- MediaPipe para tracking de manos
```

### Ejemplo 3: Archivo AGENTS.md Simple

**Archivo**: `AGENTS.md` (raíz del proyecto)

```markdown
# Reglas del Proyecto

Este proyecto utiliza React + TypeScript con Three.js.

## Comandos
- Usar `pnpm` como gestor de paquetes (NO npm)
- `pnpm dev` para desarrollo
- `pnpm build` para producción

## Estilo
- Tailwind CSS para estilos
- Componentes funcionales en React
- TypeScript strict mode habilitado
```

## Mejores Prácticas

### Organización

1. **Divide las reglas por tema**: Crea archivos separados para arquitectura, estilo de código, patrones específicos, etc.
2. **Usa nombres descriptivos**: Los nombres de archivo deben indicar claramente el contenido
3. **Mantén las reglas actualizadas**: Revisa y actualiza las reglas cuando cambie la arquitectura del proyecto

### Contenido

1. **Sé específico**: Proporciona ejemplos concretos en lugar de instrucciones vagas
2. **Incluye contexto**: Explica el "por qué" además del "qué"
3. **Documenta patrones**: Incluye patrones comunes y anti-patrones a evitar
4. **Referencia archivos existentes**: Menciona archivos del proyecto como ejemplos

### Metadatos

1. **Usa `globs` para especificidad**: Limita las reglas a los archivos relevantes
2. **Marca reglas importantes con `alwaysApply`**: Para reglas arquitectónicas fundamentales
3. **Proporciona descripciones claras**: Ayudan a identificar reglas en la interfaz

## Referencias

- [Documentación Oficial de Cursor - Conceptos](https://docs.cursor.com/es/get-started/concepts)
- [Documentación Oficial de Cursor - Agente](https://docs.cursor.com/es/agent)
- [Documentación Oficial de Cursor - Trabajar con Documentación](https://docs.cursor.com/es/guides/advanced/working-with-documentation)

## Notas Adicionales

- Las reglas en `.cursor/rules/` pueden estar bajo control de versiones, lo que permite compartir las convenciones del proyecto con todo el equipo
- El formato MDC es más potente que el Markdown simple, pero ambos son válidos
- Las reglas se evalúan dinámicamente según el contexto actual del editor
- Puedes combinar múltiples archivos de reglas para una organización modular

