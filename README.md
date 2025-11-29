# RSS Reader Antigravity 🚀

> **Un experimento de desarrollo asistido por IA Multi-Agente**

Este proyecto no es solo un lector RSS moderno y capaz de funcionar sin conexión; es el resultado de un experimento de aprendizaje colaborativo entre un desarrollador humano y un ecosistema de agentes de IA avanzados, editores de código de próxima generación y modelos de lenguaje de vanguardia.

📚 **[Ver Reporte de Aprendizajes](docs/aprendizajes.md)** - Análisis detallado de la arquitectura técnica, desafíos de implementación y lecciones clave de este proyecto.

![Home Light](public/screenshots/home-populated-light.webp)

## 🤖 El Experimento: "Meta-Desarrollo"

El objetivo principal de este repositorio es explorar los límites del desarrollo de software asistido por IA, orquestando múltiples herramientas y "cerebros" digitales para construir una aplicación compleja, pulida y funcional.

### La "Tripulación" de IA y Herramientas

Este proyecto ha sido forjado utilizando una combinación sinérgica de tecnologías:

*   **Editores y Entornos**:
    *   **VS Code**: La base sólida y extensible.
    *   **Cursor**: Para la edición de código fluida impulsada por IA.
    *   **Antigravity**: El entorno agéntico avanzado de Google Deepmind para tareas complejas y razonamiento profundo.

*   **Modelos de Inteligencia Artificial**:
    *   **Gemmi 3**: Utilizado para razonamiento lógico y estructuración de datos.
    *   **Opus 4.5**: Encargado de la arquitectura de alto nivel y soluciones creativas.
    *   **Minimax M2**: Optimización de código y refactorización rápida.
    *   *Y otros modelos auxiliares para tareas específicas.*

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

1. **Instalar dependencias:**

```bash
pnpm install
# o
npm install
```

2. **Iniciar el servidor de desarrollo:**

```bash
pnpm dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🧪 E2E Tests (Playwright)

El repositorio incluye pruebas end-to-end con Playwright para validar flujos críticos como la regeneración de artículos y la persistencia en IndexedDB.

```bash
# Instalar Playwright
pnpm add -D @playwright/test
npx playwright install

# Ejecutar tests
pnpm run test:e2e
```

## 📄 Licencia

MIT

## 👥 Créditos

Esta aplicación fue creada como parte de un proyecto de aprendizaje en [webcode.es](https://webcode.es), explorando el futuro del desarrollo con IA.

Para consultas o soporte, contacta a: <info@webcode.es>.
