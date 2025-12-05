# Visión General de la Arquitectura

RSS Reader Antigravity es una aplicación **Next.js 16 + React 19** diseñada con una filosofía **Offline-First**.

## Conceptos Clave

### 1. Arquitectura Híbrida (Cliente + Servidor)

- **Cliente (UI + Estado)**:

  - La interfaz de usuario se ejecuta en el navegador.
  - **IndexedDB** es la fuente de la verdad para el estado de la aplicación (feeds, artículos, configuración).
  - El estado fluye a través de React Contexts (`src/contexts/*`) y Hooks personalizados (`src/hooks/*`).

- **Servidor (API Routes)**:
  - Todo el código que requiere Node.js nativo o acceso a redes externas vive en `src/app/api/*`.
  - Esto evita problemas de CORS y mantiene el bundle del cliente ligero.
  - Funciones principales del servidor:
    - Proxy de RSS (`/api/rss`).
    - Scraping y limpieza de contenido (`/api/scrape`).
    - Optimización de imágenes.

### 2. Flujo de Datos "DB-First"

La aplicación sigue un patrón estricto donde la UI reacciona a los cambios en la base de datos local, en lugar de al revés.

1.  **Acción de Usuario**: El usuario añade un feed.
2.  **API Call**: El cliente solicita los datos al servidor (`/api/rss`).
3.  **Persistencia**: Los datos recibidos se guardan inmediatamente en `src/lib/db.ts` (IndexedDB).
4.  **Reactividad**: Los hooks como `useFeeds` detectan cambios en la DB y actualizan la UI.

### 3. Archivos Críticos

| Archivo/Directorio                   | Descripción                                                                                                |
| :----------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `src/lib/db.ts`                      | **El corazón de la app**. Define el esquema de IndexedDB, migraciones y helpers (`addFeed`, `addArticle`). |
| `src/hooks/useFeeds.ts`              | Maneja el ciclo de vida de los feeds y la lógica de actualización.                                         |
| `src/app/api/rss/route.ts`           | Proxy para parsear RSS usando `rss-parser`.                                                                |
| `src/app/api/scrape/route.ts`        | Pipeline de scraping: Readability -> Cheerio -> Sanitización -> Sharp (imágenes).                          |
| `src/lib/summarization*.ts`          | Lógica de IA para resúmenes (Chrome AI + Transformers.js fallback).                                        |
| `src/components/layout/AppShell.tsx` | Shell principal de la UI, manejo de temas y feeds por defecto.                                             |

## Pipeline de Scraping y Procesamiento

El sistema de scraping es robusto y sigue un orden de prioridad:

1.  **Readability**: Intenta extraer el contenido principal usando la librería de Mozilla.
2.  **Cheerio**: Si Readability falla o es insuficiente, se usa Cheerio para selectores manuales o limpieza agresiva.
3.  **Sanitización**: Se limpian scripts, iframes peligrosos y estilos inline.
4.  **Optimización de Imágenes**: Las imágenes extraídas se procesan con `sharp` para convertirlas a WebP (max 1200px), reduciendo el ancho de banda y mejorando el rendimiento.

## IA y Resúmenes

La aplicación utiliza un enfoque híbrido para la IA:

- **Chrome Built-in AI**: Se prefiere si está disponible en el navegador del usuario (rápido, privado, sin coste).
- **Transformers.js (Web Worker)**: Fallback local que ejecuta modelos pequeños (como DistilBART) en un Web Worker si Chrome AI no está disponible.
- Los resúmenes se cachean en el registro del artículo en IndexedDB para evitar re-procesamiento.

## Convenciones de Código

- **Manejo de Errores**:
  - `UserError`: Para fallos esperados que el usuario debe ver (ej. "URL inválida"). Se muestran en la UI.
  - `Error` estándar: Para fallos de desarrollador/sistema. Se loguean en consola.
- **Estado de Actividad**: Las tareas largas (fetching, scraping) deben reportar su estado vía `ActivityStatusContext`.
