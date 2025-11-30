# RSS Reader Antigravity 🚀

> **Un experimento de desarrollo asistido por IA Multi-Agente**

Este proyecto no es solo un lector RSS moderno y capaz de funcionar sin conexión; es el resultado de un experimento de aprendizaje colaborativo entre un desarrollador humano y un ecosistema de agentes de IA avanzados, editores de código de próxima generación y modelos de lenguaje de vanguardia.

📚 **[Ver Reporte de Aprendizajes](docs/aprendizajes.md)** - Análisis detallado de la arquitectura técnica, desafíos de implementación y lecciones clave de este proyecto.

![Home Light](public/screenshots/home-populated-light.webp)

## 🤖 El Experimento: "Meta-Desarrollo"

El objetivo principal de este repositorio es explorar los límites del desarrollo de software asistido por IA, orquestando múltiples herramientas y "cerebros" digitales para construir una aplicación compleja, pulida y funcional.

### La "Tripulación" de IA y Herramientas

Este proyecto ha sido forjado utilizando una combinación sinérgica de tecnologías:

- **Editores y Entornos**:

  - **VS Code**: La base sólida y extensible.
  - **Cursor**: Para la edición de código fluida impulsada por IA.
  - **Antigravity**: El entorno agéntico avanzado de Google Deepmind para tareas complejas y razonamiento profundo.

- **Modelos de Inteligencia Artificial**:
  - **Gemmi 3**: Utilizado para razonamiento lógico y estructuración de datos.
  - **Opus 4.5**: Encargado de la arquitectura de alto nivel y soluciones creativas.
  - **Minimax M2**: Optimización de código y refactorización rápida.
  - _Y otros modelos auxiliares para tareas específicas._

---

## 📱 Sobre la Aplicación

RSS Reader Antigravity es un lector de noticias minimalista, rápido y estéticamente cuidado, diseñado para ofrecer una experiencia de lectura premium.

### Características Principales

- **Soporte Offline**: Persistencia total de feeds y artículos usando IndexedDB. Lee tus noticias sin conexión.
- **Parsing RSS Robusto**: Proxy de servidor con `rss-parser` para evitar problemas de CORS y compatibilidad.
- **Web Scraping Híbrido**: Extracción inteligente de contenido utilizando Mozilla Readability como primario y Cheerio como fallback, optimizado para medios en español.
- **UI Moderna y Fluida**: Interfaz construida con Tailwind CSS, Shadcn UI y animaciones suaves.
- **Modo Oscuro**: Soporte nativo con transiciones elegantes.
- **Optimización de Imágenes**: Procesamiento automático con Sharp para servir imágenes optimizadas en formato WebP.

## 📸 Capturas de Pantalla

### Home Screen (Dark Mode)

![Home Dark](public/screenshots/home-populated-dark.webp)

### Experiencia de Lectura

![Article View](public/screenshots/article-view-light.webp)

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **Estado/Almacenamiento**: IndexedDB (via `idb`), Custom Hooks
- **Backend API**: Next.js API Routes
- **Scraping**: Mozilla Readability, JSDOM, Cheerio, Sanitize-HTML, Sharp
- **Utilidades**: Luxon (Fechas), Sonner (Toasts)

## 🚀 Getting Started

1. **Requisito:** usa `pnpm` (preferred). Este proyecto está diseñado
   para ejecutarse con `pnpm` — evita `npm` o `yarn` para operaciones rutinarias.

2. **Instalar dependencias:**

```bash
pnpm install
```

3. **Iniciar el servidor de desarrollo:**

```bash
pnpm dev
```

Abre `http://localhost:3000` en tu navegador.

## 🔖 Changelog (reciente)

- **PR #6** — feat(articles): añadida imagen de placeholder y mejoras en el estado vacío (`public/empty-state-creative.png`, `src/components/articles/ArticleList.tsx`). Mergeado en `main` (commit `31c2882`).
- **PR #7** — perf(theme): optimizaciones de rendimiento en `ThemeCarousel`, nueva utilidad `src/hooks/useAnimationPause.ts` y notas de rendimiento en `docs/performance-tasks.md`. Mergeado en `main` (commit `6f781d0`).

Consulta `docs/performance-tasks.md` para los detalles de las optimizaciones y recomendaciones de benchmark.

## Contribuciones

Gracias por tu interés en contribuir. Pequeñas pautas rápidas:

- Usa `pnpm` para instalar y ejecutar scripts.
- Abre PRs desde ramas con nombres descriptivos (ej. `feat/…`, `fix/…`, `perf/…`).
- Asegúrate de ejecutar `pnpm lint` y `pnpm build` antes de enviar PRs.
- Para cambios grandes, abre primero un issue describiendo el alcance.

## 📄 Licencia

MIT

## 👥 Créditos

Esta aplicación fue creada como parte de un proyecto de aprendizaje en [webcode.es](https://webcode.es), explorando el futuro del desarrollo con IA.

Para consultas o soporte, contacta a: <info@webcode.es>.
