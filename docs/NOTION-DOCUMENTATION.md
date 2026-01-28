# RSS Reader Antigravity - Documentación Completa para Notion

> 🔒 **DOCUMENTO PRIVADO** - Contiene información sensible (API keys, tokens)

---

## 📋 Información General del Proyecto

### Descripción

RSS Reader Antigravity es un lector de noticias moderno, minimalista y offline-first, diseñado para ofrecer una experiencia de lectura premium. Es el resultado de un experimento de desarrollo asistido por IA Multi-Agente, explorando los límites del desarrollo de software asistido por IA.

**Características principales:**

- ✅ Soporte Offline completo (IndexedDB)
- 🔄 Parsing RSS robusto con proxy de servidor
- 🕷️ Web Scraping híbrido (Readability + Cheerio)
- 🎨 UI moderna y fluida con Tailwind CSS
- 🌓 Modo oscuro nativo
- 🖼️ Optimización automática de imágenes (WebP)
- 🤖 Resúmenes con IA (3 proveedores: Chrome Nano, Gemini API, Transformers.js local)
- 🇪🇸 Optimizado para medios españoles

### Enlaces del Proyecto

- **Repositorio GitHub**: https://github.com/JordiNodeJS/rss-reader
- **Documento Notion**: https://www.notion.so/rick-morty-gravi-2f3f4dc3b462810c8889cd2abe9279fb
- **Base de datos "repo"**: https://www.notion.so/238f4dc3b46280a5bda5c2a661bd7d1e

---

## 🛠️ Stack Tecnológico

### Frontend

- **Framework**: Next.js 16 (App Router) + React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Componentes UI**: Shadcn UI, Radix UI
- **Iconos**: Lucide Icons
- **Animaciones**: GSAP, Tailwind Animate

### Backend/API

- **Runtime**: Node.js 22.x
- **API Routes**: Next.js API Routes
- **Parsing RSS**: rss-parser
- **Scraping**: Mozilla Readability, JSDOM, Cheerio
- **Sanitización HTML**: sanitize-html
- **Procesamiento de imágenes**: Sharp

### Almacenamiento y Persistencia

- **Client-Side DB**: IndexedDB (via idb/Dexie)
- **State Management**: Zustand
- **Backup**: localStorage (feeds backup)
- **Cache**: Cache API (para modelos AI)

### AI/ML

- **Chrome Summarizer API**: Gemini Nano (Built-in AI)
- **Google Gemini API**: gemini-1.5-flash (Cloud)
- **Transformers.js**: @huggingface/transformers (local)
- **Modelos locales**: DistilBART, BART CNN

### Servicios en la Nube

- **Rate Limiting**: Upstash Redis
- **API Keys Storage**: Variables de entorno
- **Hosting**: Compatible con Vercel/Netlify

### Utilidades

- **Fechas**: Luxon
- **Notificaciones**: Sonner (toasts)
- **Drag & Drop**: @dnd-kit
- **Temas**: next-themes

---

## 📁 Arquitectura del Proyecto

### Estructura de Carpetas Principal

```
rss-reader-antigravity/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (RSS, Scrape, Summarize)
│   │   ├── help/              # Página de ayuda
│   │   ├── tutorial/          # Tutorial interactivo
│   │   ├── layout.tsx         # Layout principal + theme bootstrap
│   │   └── page.tsx/client.tsx # Páginas servidor/cliente
│   ├── components/            # Componentes React
│   │   ├── layout/           # AppShell, Sidebar, etc.
│   │   ├── articles/         # ArticleCard, ArticleView
│   │   ├── ui/              # Shadcn components
│   │   └── *.tsx            # Componentes de nivel superior
│   ├── hooks/                # Custom React hooks
│   │   ├── useFeeds.ts       # 🔑 Hook principal (feeds/articles)
│   │   ├── useSummary.ts     # Hook de resúmenes AI
│   │   └── useTranslation.ts # Hook de traducción
│   ├── lib/                  # Utilidades y lógica de negocio
│   │   ├── db.ts            # 🔑 IndexedDB schema y operaciones
│   │   ├── db-monitor.ts    # Monitoreo de IndexedDB
│   │   ├── summarization*.ts # Sistema de resúmenes
│   │   └── theme-loader.ts  # Sistema de temas
│   ├── contexts/            # React Contexts
│   └── types/               # TypeScript type definitions
├── public/
│   ├── styles/themes/       # 50+ temas CSS
│   └── images/             # Assets estáticos
├── docs/                    # 📚 Documentación completa
│   ├── architecture/        # Diagramas y análisis
│   ├── features/           # Guías de funcionalidades
│   ├── getting-started/    # Setup y onboarding
│   └── project-management/ # Tasks, aprendizajes, historias
└── scripts/                # Utilidades de desarrollo
```

### Flujos Clave

#### 1. Ciclo de vida de un Feed

```
Usuario añade URL → useFeeds.addNewFeed()
→ Fetch /api/rss?url=... (servidor)
→ Parse con rss-parser
→ Almacena en IndexedDB (db.ts)
→ UI actualiza automáticamente
```

#### 2. Scraping de Artículo

```
Usuario hace clic en artículo → Fetch /api/scrape?url=...
→ Readability (primario) → Cheerio (fallback)
→ Optimización de imágenes (Sharp → WebP)
→ Almacena contenido completo en IndexedDB
```

#### 3. Resumen con IA

```
Usuario solicita resumen → useSummary.generate()
→ Selecciona proveedor (Chrome/Gemini/Local)
→ Genera resumen (con cache)
→ Almacena en IndexedDB
→ Opcional: Traducir con Chrome Translation API
```

---

## 🔐 Variables de Entorno

<details>
<summary><strong>🔴 SECCIÓN PRIVADA - Variables de Entorno y Credenciales</strong></summary>

### Desarrollo Local (.env.local)

```env
# ============================================
# 🤖 GOOGLE GEMINI API (Client + Server)
# ============================================

# Client-side (expuesta al navegador)
# Obtener en: https://aistudio.google.com/app/apikey
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC...

# Server-side (proxy /api/summarize)
GEMINI_API_KEY=AIzaSyC...

# 📋 CUENTA DE GOOGLE CLOUD ASOCIADA:
# Nombre: rss-reader
# ID del proyecto: gen-lang-client-0389507106
# Número del proyecto: 614765996314
# Panel: https://console.cloud.google.com/

# ============================================
# 🔴 UPSTASH REDIS (Rate Limiting)
# ============================================

# Obtener en: https://console.upstash.com/
# Cuenta: frontend.flipoeyewear@gmail.com
UPSTASH_REDIS_REST_URL=https://premium-guppy-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXlkAAIjcE...

# Configuración:
# - Plan: Free Tier
# - Región: EU-WEST-1 (Frankfurt)
# - Uso: Rate limiting para /api/summarize

# ============================================
# 📚 CONTEXT7 API (VS Code MCP)
# ============================================

# Obtener en: https://context7.com/
CONTEXT7_API_KEY=ctx7_...

# ============================================
# 🗄️ POSTGRESQL (VS Code MCP)
# ============================================

# Formato: postgres://user:password@host:port/database?sslmode=require
DATABASE_URL=postgresql://user:pass@localhost:5432/rssreader

# ============================================
# 🌐 PRODUCCIÓN (Vercel/Netlify)
# ============================================

# Todas las variables de arriba deben configurarse en:
# - Vercel: Settings → Environment Variables
# - Netlify: Site settings → Build & deploy → Environment

# ⚠️ IMPORTANTE:
# - NO SUBIR .env.local al repositorio
# - .env.example solo contiene plantillas sin valores reales
# - Rotar tokens si se exponen públicamente
```

### Descripción de Variables

| Variable                     | Tipo   | Propósito                          | Dónde Obtener                                              |
| ---------------------------- | ------ | ---------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Client | Resúmenes con Gemini (browser)     | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GEMINI_API_KEY`             | Server | Resúmenes vía proxy (rate-limited) | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `UPSTASH_REDIS_REST_URL`     | Server | Conexión a Redis                   | [Upstash Console](https://console.upstash.com/)            |
| `UPSTASH_REDIS_REST_TOKEN`   | Server | Autenticación Redis                | [Upstash Console](https://console.upstash.com/)            |
| `CONTEXT7_API_KEY`           | Dev    | Documentación AI                   | [Context7](https://context7.com/)                          |
| `DATABASE_URL`               | Dev    | Base de datos PostgreSQL           | Tu proveedor DB                                            |

### Separación Desarrollo vs Producción

**Desarrollo (.env.local):**

- Usa API keys de desarrollo/testing
- Rate limits más permisivos
- Logs verbosos habilitados
- Cache deshabilitado para debugging

**Producción (Vercel Environment Variables):**

- API keys de producción con cuotas más altas
- Rate limiting estricto (Upstash Redis)
- Logs solo errores
- Cache agresivo habilitado

### Seguridad

🔒 **Este documento es PRIVADO** - Contiene credenciales reales:

- ✅ Guardado solo en Notion (privado)
- ❌ NO compartir públicamente
- ❌ NO incluir en README.md
- ❌ NO subir a GitHub
- ✅ Rotar tokens si se exponen

</details>

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias (SOLO usar pnpm)
pnpm install

# Desarrollo local (http://localhost:3000)
pnpm dev

# Build de producción
pnpm build

# Servidor de producción
pnpm start

# Linting
pnpm lint

# Fix binarios de Sharp (Windows)
pnpm rebuild sharp
```

⚠️ **IMPORTANTE**: Este proyecto usa **pnpm** exclusivamente. Ver [docs/standards/package-manager-rules.md](../standards/package-manager-rules.md)

---

## 📚 Funcionalidades Principales

### 1. Gestión de Feeds RSS

- Añadir feeds por URL
- Actualización automática/manual
- Organización por categorías
- Ordenar feeds (drag & drop)
- Importar/exportar OPML

### 2. Scraping Inteligente

- **Motor primario**: Mozilla Readability
- **Fallback**: Cheerio con selectores por dominio
- **Optimización**: Sharp (resize + WebP conversion)
- **Sanitización**: HTML limpio y seguro
- **Soporte especial**: 20+ medios españoles

### 3. Resúmenes con IA (Multi-Provider)

#### Proveedor: Chrome Summarizer (Nano)

- **Modelo**: Gemini Nano (Built-in AI)
- **Disponibilidad**: Chrome 138+ con flag habilitado
- **Ventajas**: Alta calidad, sin API key, streaming nativo
- **Limitaciones**: Solo Chrome, requiere descarga del modelo

#### Proveedor: Google Gemini API (Cloud)

- **Modelo**: gemini-1.5-flash
- **Ventajas**: Máxima calidad, contexto largo (1M tokens)
- **Configuración**: Requiere API key
- **Rate Limiting**: Upstash Redis (10 req/min/IP gratis)

#### Proveedor: Transformers.js (Local)

- **Modelos**: DistilBART CNN, BART Large
- **Ventajas**: Cross-browser, offline, privacidad total
- **Ejecución**: Web Worker (no bloquea UI)
- **Cache**: Cache API para modelos descargados

#### Longitudes de Resumen

- `short`: 2-3 oraciones
- `medium`: 4-5 oraciones
- `long`: 6-8 oraciones
- `extended`: 7-10 oraciones / 10+ bullet points

#### Tipos de Resumen

- `tldr`: Resumen general
- `key-points`: Puntos clave (bullets)
- `teaser`: Gancho periodístico
- `headline`: Titular

### 4. Sistema de Temas

- **50+ temas** incluidos
- Categorías: Minimal, Dark, Tech, Fantasy, Retro
- Personalización: Variables CSS customizables
- Anti-FOUC: Pre-carga desde localStorage
- Generador: Scripts automáticos

### 5. Traducción Automática

- **Chrome Translation API** (Built-in AI)
- Detección automática de idioma
- Traducción de resúmenes al español
- Gestión de modelos descargados

### 6. Offline-First

- Toda la data en IndexedDB
- Backup en localStorage
- Service Worker (cacheo estático)
- Sync en background

---

## 🎯 Casos de Uso Principales

1. **Lector de Noticias Español**: Agregar feeds de El País, El Confidencial, etc.
2. **Research Assistant**: Resúmenes automáticos de artículos largos
3. **Offline Reading**: Leer artículos completos sin conexión
4. **Multi-Language**: Traducir contenido internacional al español
5. **Clean Reading**: Experiencia sin ads/distracciones

---

## 🐛 Debugging y Testing

### Herramientas Recomendadas

- **chrome-devtools MCP**: Testing en navegador real
- **next-devtools MCP**: Inspección de rutas SSR/CSR
- **DevTools**: IndexedDB inspector, Network, Console

### Comandos de Testing

```bash
# Probar endpoint RSS
curl "http://localhost:3000/api/rss?url=https://elpais.com/rss/elpais/portada.xml"

# Probar endpoint Scrape
curl "http://localhost:3000/api/scrape?url=https://elpais.com/articulo"

# Probar Upstash
pnpm dlx tsx tests/upstash-test.mjs
```

### Logs y Monitoreo

- **db-monitor.ts**: Logs de eventos IndexedDB
- **Activity Status**: Tracking de tareas largas
- **Console Logs**: `DEBUG=summarization:*` para AI

---

## 📝 Aprendizajes Clave del Proyecto

Ver documento completo en [docs/project-management/aprendizajes.md](../project-management/aprendizajes.md)

### Highlights:

1. **Scraping Híbrido**: Readability + Cheerio = 90%+ éxito
2. **Offline-First**: IndexedDB > localStorage para datos complejos
3. **AI Multi-Provider**: Fallback strategies = mejor UX
4. **Server Proxies**: Evitar CORS y bundle Node-only libs
5. **Theme Bootstrapping**: Pre-React script para anti-FOUC
6. **Error Handling**: UserError vs Error para control de flujo

---

## 🔄 Estado del Proyecto

**Versión Actual**: 0.1.0  
**Licencia**: MIT  
**Estado**: ✅ Producción Ready  
**Última Actualización**: Enero 2026

### Roadmap Futuro

- [ ] PWA completa (offline install)
- [ ] Sync multi-dispositivo
- [ ] Más proveedores AI (Claude, LLaMA local)
- [ ] Mobile app (React Native)
- [ ] Plugin de navegador

---

## 👥 Contribución

Este proyecto es el resultado de un experimento de desarrollo asistido por IA Multi-Agente:

**"Tripulación" de IA:**

- **VS Code + Cursor**: Edición base
- **Antigravity**: Entorno agéntico (Google Deepmind)
- **Modelos**:
  - Gemini 3 (razonamiento lógico)
  - Opus 4.5 (arquitectura de alto nivel)
  - Minimax M2 (optimización de código)

**Humano**: JordiNodeJS (orquestación y dirección)

---

## 📞 Contacto y Soporte

**Desarrollador**: JordiNodeJS  
**GitHub**: https://github.com/JordiNodeJS  
**Repositorio**: https://github.com/JordiNodeJS/rss-reader

---

## 📄 Licencia

MIT License - Ver [LICENSE](../LICENSE)

---

_Documento generado el 28 de Enero de 2026_  
_Última actualización: 28/01/2026_
