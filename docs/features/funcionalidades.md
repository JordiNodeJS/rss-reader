# Funcionalidades de RSS Reader Antigravity

> Documentación completa de todas las funcionalidades disponibles en la aplicación.

## Índice

- [Gestión de Feeds](#gestión-de-feeds)
- [Lectura de Artículos](#lectura-de-artículos)
- [Web Scraping](#web-scraping)
- [Resúmenes con IA](#resúmenes-con-ia)
- [Búsqueda y Filtrado](#búsqueda-y-filtrado)
- [Favoritos](#favoritos)
- [Personalización Visual](#personalización-visual)
- [Modo Offline](#modo-offline)
- [Gestión de Caché](#gestión-de-caché)
- [Monitorización y Debugging](#monitorización-y-debugging)

---

## Gestión de Feeds

### 1.1. Añadir Feeds RSS

**Descripción:** Permite agregar nuevas fuentes RSS mediante URL o seleccionando presets populares.

**Funcionalidades:**

- ✅ Añadir feed mediante URL manual
- ✅ Seleccionar feeds de una lista de presets populares (medios españoles)
- ✅ Validación automática de la URL del feed
- ✅ Parsing robusto de RSS/Atom mediante proxy de servidor
- ✅ Extracción automática de metadatos (título, descripción, icono)
- ✅ Descarga automática de artículos al añadir el feed
- ✅ Notificaciones de éxito/error con toast
- ✅ Backup automático a localStorage

**Presets incluidos:**

- El País (portada, deportes, cultura, tecnología)
- La Vanguardia (portada)
- El Confidencial
- eldiario.es
- ABC
- RTVE Noticias
- Y muchos más...

**Detalles técnicos:**

- Endpoint: `/api/rss?url=...`
- Parser: `rss-parser` (servidor)
- Storage: IndexedDB + localStorage backup
- Hook principal: `useFeeds.addNewFeed(url)`

---

### 1.2. Eliminar Feeds

**Descripción:** Elimina feeds de la biblioteca junto con todos sus artículos asociados.

**Funcionalidades:**

- ✅ Botón de eliminación en cada feed del sidebar
- ✅ Confirmación antes de eliminar (previene borrado accidental)
- ✅ Eliminación en cascada de artículos asociados
- ✅ Actualización automática de la interfaz
- ✅ Sincronización con backup de localStorage

**Detalles técnicos:**

- Hook: `useFeeds.removeFeed(feedId)`
- Elimina feed + artículos de IndexedDB
- Actualiza backup en localStorage

---

### 1.3. Actualizar Feeds

**Descripción:** Refresca el contenido de los feeds para obtener nuevos artículos.

**Funcionalidades:**

- ✅ Botón de actualización global (actualiza todos los feeds)
- ✅ Botón de actualización individual por feed
- ✅ Indicador visual de proceso de actualización
- ✅ Descarga solo de artículos nuevos (evita duplicados)
- ✅ Notificación de cantidad de artículos nuevos
- ✅ Manejo de errores con reintentos automáticos

**Detalles técnicos:**

- Hook: `useFeeds.updateAllFeeds()` o `useFeeds.updateFeed(feedId)`
- Compara GUIDs para evitar duplicados
- Activity tracking: `fetching-rss`
- Límite de reintentos: 3 intentos con backoff exponencial

---

### 1.4. Ordenar y Organizar Feeds

**Descripción:** Permite reorganizar los feeds mediante drag & drop.

**Funcionalidades:**

- ✅ Arrastrar y soltar feeds para reordenarlos
- ✅ Persistencia del orden en IndexedDB
- ✅ Sincronización inmediata con la interfaz
- ✅ Visual feedback durante el drag

**Detalles técnicos:**

- Hook: `useFeeds.reorderFeeds(newOrder)`
- Biblioteca: `@dnd-kit/core` + `@dnd-kit/sortable`
- Campo DB: `feed.order`

---

### 1.5. Marcar Feeds como Favoritos

**Descripción:** Destacar feeds importantes con un marcador de favorito.

**Funcionalidades:**

- ✅ Icono de estrella en cada feed
- ✅ Toggle rápido con un clic
- ✅ Visual distintivo para feeds favoritos
- ✅ Persistencia en IndexedDB

**Detalles técnicos:**

- Hook: `useFeeds.toggleFeedFavorite(feedId)`
- Campo DB: `feed.isFavorite`

---

### 1.6. Editar Nombre del Feed

**Descripción:** Personalizar el nombre de visualización de un feed.

**Funcionalidades:**

- ✅ Doble clic en el nombre para editar
- ✅ Guardar con Enter o clic fuera
- ✅ Cancelar con Escape
- ✅ Fallback al título original del feed

**Detalles técnicos:**

- Hook: `useFeeds.updateFeedCustomTitle(feedId, title)`
- Campo DB: `feed.customTitle`
- Prioridad: `customTitle` > `title`

---

## Lectura de Artículos

### 2.1. Vista de Lista de Artículos

**Descripción:** Visualización en lista de todos los artículos disponibles.

**Funcionalidades:**

- ✅ Lista compacta con título, extracto, fecha y miniatura
- ✅ Indicador de origen (nombre del feed)
- ✅ Indicador visual de artículo no leído
- ✅ Fecha relativa (ej: "hace 2 horas")
- ✅ Scroll infinito con lazy loading
- ✅ Vista de "Todos los artículos" o filtrada por feed
- ✅ Contador de artículos disponibles

**Detalles técnicos:**

- Componente: `ArticleList`
- Ordenación: fecha descendente (más recientes primero)
- Virtualización: Implementada para listas grandes

---

### 2.2. Vista Detallada de Artículo

**Descripción:** Visualización completa del contenido de un artículo.

**Funcionalidades:**

- ✅ Modal a pantalla completa con contenido
- ✅ Renderizado de contenido HTML sanitizado
- ✅ Mostrar imágenes optimizadas (WebP)
- ✅ Metadata: autor, fecha, fuente
- ✅ Enlace al artículo original
- ✅ Botones de acción (scrape, favorito, compartir)
- ✅ Lazy loading del componente
- ✅ Navegación con teclado (Escape para cerrar)

**Detalles técnicos:**

- Componente: `ArticleView` (lazy loaded)
- Sanitización: `sanitize-html`
- Optimización de imágenes: Sharp (servidor)

---

### 2.3. Abrir en Navegador

**Descripción:** Abre el artículo original en una nueva pestaña del navegador.

**Funcionalidades:**

- ✅ Botón "Ver original" en vista de artículo
- ✅ Abre en nueva pestaña
- ✅ Preserva el contexto de la app

**Detalles técnicos:**

- Link directo con `target="_blank"` y `rel="noopener noreferrer"`

---

## Web Scraping

### 3.1. Extracción de Contenido Completo

**Descripción:** Descarga y procesa el contenido completo de artículos con contenido parcial en RSS.

**Funcionalidades:**

- ✅ Scraping híbrido: Mozilla Readability + Cheerio fallback
- ✅ Extracción de texto principal del artículo
- ✅ Descarga y optimización de imágenes
- ✅ Conversión automática a WebP
- ✅ Limpieza de scripts y estilos
- ✅ Reglas específicas para medios españoles
- ✅ Indicador de progreso
- ✅ Manejo de errores con mensajes descriptivos
- ✅ Cache del contenido scrapeado en IndexedDB

**Flujo de extracción:**

1. Intentar con Mozilla Readability (preferido)
2. Si falla, usar Cheerio con selectores específicos
3. Procesar imágenes con Sharp
4. Sanitizar HTML
5. Guardar en IndexedDB

**Detalles técnicos:**

- Endpoint: `/api/scrape?url=...`
- Libraries: `@mozilla/readability`, `jsdom`, `cheerio`, `sharp`
- Hook: `useFeeds.scrapeArticle(articleId)`
- Activity tracking: `scraping`
- Campo DB: `article.scrapedContent`

**Selectores optimizados para:**

- El País
- La Vanguardia
- El Confidencial
- ABC
- RTVE
- Y muchos más...

---

### 3.2. Eliminar Contenido Scrapeado

**Descripción:** Libera espacio eliminando el contenido descargado.

**Funcionalidades:**

- ✅ Botón "Unsave" en artículos scrapeados
- ✅ Reversión al contenido RSS original
- ✅ Liberación inmediata de espacio en IndexedDB
- ✅ Mantenimiento de metadatos originales

**Detalles técnicos:**

- Hook: `useFeeds.unsaveArticle(articleId)`
- Elimina campo `scrapedContent` de IndexedDB

---

## Resúmenes con IA

### 4.1. Generación de Resúmenes Locales

**Descripción:** Crea resúmenes automáticos usando IA local (Transformers.js).

**Funcionalidades:**

- ✅ Procesamiento 100% local (sin enviar datos a servidores)
- ✅ 4 longitudes: short, medium, long, extended
- ✅ 4 tipos: tl;dr, key-points, teaser, headline
- ✅ Modelos cuantizados para velocidad
- ✅ Ejecución en Web Worker (no bloquea UI)
- ✅ Cache de modelos en Cache API
- ✅ Pre-carga de modelos para mejor UX
- ✅ Indicador de progreso
- ✅ Estimación de tiempo
- ✅ Soporte multi-idioma (ES, EN, CA, etc.)

**Modelos disponibles:**

- **DistilBART-CNN-12-6** (recomendado, ~300MB)
- **BART-Large-CNN** (mejor calidad, ~1.6GB)
- **T5-Small** (~240MB)

**Detalles técnicos:**

- Hook: `useSummary()`
- Biblioteca: `@huggingface/transformers`
- Worker: `src/lib/summarization-worker.ts`
- Storage: Cache API + IndexedDB para resúmenes generados

---

### 4.2. Resúmenes con Chrome Summarizer API

**Descripción:** Usa la API nativa de Chrome (Gemini Nano) cuando está disponible.

**Funcionalidades:**

- ✅ Detección automática de disponibilidad
- ✅ Descarga gestionada por Chrome
- ✅ Streaming de resumen en tiempo real
- ✅ Máxima calidad con mínimo overhead
- ✅ Fallback automático a Transformers.js

**Requisitos:**

- Chrome 128+ con flags habilitados
- Sistema compatible con Chrome AI

**Detalles técnicos:**

- API: `window.ai.summarizer`
- Modelo: Gemini Nano (local)

---

### 4.3. Resúmenes con Google Gemini API (Cloud)

**Descripción:** Usa la API de Google Gemini para resúmenes de máxima calidad.

**Funcionalidades:**

- ✅ Máxima calidad y contexto
- ✅ Soporte para documentos largos
- ✅ Funciona en cualquier navegador
- ✅ Configuración de API Key por usuario
- ✅ Validación de API Key
- ✅ Rate limiting integrado
- ✅ Manejo de cuotas y errores
- ✅ Caché de respuestas

**Requisitos:**

- API Key de Google AI Studio (gratuita)
- Conexión a internet

**Detalles técnicos:**

- Modelo: `gemini-1.5-flash-latest`
- Rate limit: 15 requests/minuto (configurable)
- Endpoint: `generativelanguage.googleapis.com`

---

### 4.4. Gestión de Consentimiento IA

**Descripción:** Sistema de disclaimers y configuración para funcionalidades de IA.

**Funcionalidades:**

- ✅ Disclaimer inicial explicando el uso de IA
- ✅ Selector de proveedor (Local/Chrome/Gemini)
- ✅ Selector de modelo local
- ✅ Gestión de API Keys
- ✅ Información de tamaño de modelos
- ✅ Indicador de descarga de modelos
- ✅ Limpieza de caché de modelos
- ✅ Estadísticas de uso

**Detalles técnicos:**

- Componente: `AIDisclaimer`
- Storage: localStorage para preferencias

---

## Búsqueda y Filtrado

### 5.1. Búsqueda de Artículos

**Descripción:** Busca artículos por título o contenido.

**Funcionalidades:**

- ✅ Búsqueda en tiempo real (sin necesidad de Enter)
- ✅ Búsqueda en título y extracto
- ✅ Case-insensitive
- ✅ Resaltado de resultados
- ✅ Contador de resultados
- ✅ Búsqueda funciona offline

**Detalles técnicos:**

- Implementación: filtrado client-side sobre IndexedDB
- Debounce: 300ms para optimizar rendimiento

---

### 5.2. Ordenación de Artículos

**Descripción:** Ordena artículos por fecha de publicación.

**Funcionalidades:**

- ✅ Ordenar por más recientes
- ✅ Ordenar por más antiguos
- ✅ Selector rápido en header
- ✅ Persistencia de preferencia

**Detalles técnicos:**

- Estado local del componente
- Ordenación reactiva con useMemo

---

### 5.3. Filtro por Feed

**Descripción:** Muestra artículos de un feed específico.

**Funcionalidades:**

- ✅ Clic en feed del sidebar
- ✅ Vista "Todos los artículos" por defecto
- ✅ Indicador visual del feed seleccionado
- ✅ Contador de artículos por feed

**Detalles técnicos:**

- Estado: `useFeeds.selectedFeedId`
- Query: `getArticlesByFeed(feedId)`

---

## Favoritos

### 6.1. Marcar Artículos como Favoritos

**Descripción:** Guarda artículos importantes para acceso rápido.

**Funcionalidades:**

- ✅ Botón de corazón en cada artículo
- ✅ Toggle rápido
- ✅ Indicador visual (corazón relleno)
- ✅ Persistencia en IndexedDB
- ✅ Sincronización con vista de artículo

**Detalles técnicos:**

- Hook: `useFeeds.toggleArticleFavorite(articleId)`
- Campo DB: `article.isFavorite`

---

### 6.2. Vista de Favoritos

**Descripción:** Filtra y muestra solo artículos favoritos.

**Funcionalidades:**

- ✅ Botón toggle "Favoritos" en header
- ✅ Estilo distintivo cuando está activo
- ✅ Contador de artículos favoritos
- ✅ Compatible con búsqueda y ordenación

**Detalles técnicos:**

- Estado local: `showFavoritesOnly`
- Filtrado reactivo con useMemo

---

## Personalización Visual

### 7.1. Temas de Color

**Descripción:** Amplia colección de temas visuales personalizables.

**Funcionalidades:**

- ✅ 50+ temas prediseñados
- ✅ Selector de tema con preview
- ✅ Temas claro y oscuro
- ✅ Temas temáticos (cyberpunk, nature, etc.)
- ✅ Cambio instantáneo sin recarga
- ✅ Persistencia en localStorage
- ✅ Prevención de FOUC (flash of unstyled content)
- ✅ Carrusel de temas con demos

**Categorías de temas:**

- Minimalistas (clean-slate, mono, modern-minimal)
- Oscuros (doom-64, darkmatter, midnight-bloom)
- Coloridos (bubblegum, candyland, synthwave)
- Profesionales (graphite, elegant-luxury)
- Naturales (kodama-grove, nature, sakura)
- Inspirados (catppuccin, claude, vscode-dark)

**Detalles técnicos:**

- Componente: `ThemeSwitcher`, `ThemeCarousel`
- Storage: localStorage
- Implementación: CSS variables + clase en `<html>`
- Script de bootstrap: previene FOUC

---

### 7.2. Animaciones y Transiciones

**Descripción:** Efectos visuales fluidos y animaciones.

**Funcionalidades:**

- ✅ Transiciones suaves entre vistas
- ✅ Animaciones de entrada/salida de modales
- ✅ Hover effects en tarjetas
- ✅ Loading skeletons
- ✅ Progress indicators
- ✅ Control de animaciones (pause/play)

**Detalles técnicos:**

- Framework: Framer Motion
- CSS: Tailwind transitions
- Hook: `useAnimationPause()`

---

## Modo Offline

### 8.1. Persistencia Local

**Descripción:** Todos los datos se guardan localmente para acceso sin conexión.

**Funcionalidades:**

- ✅ Storage completo en IndexedDB
- ✅ Backup a localStorage
- ✅ Service Worker para cacheo de assets
- ✅ Lectura completa offline
- ✅ Sincronización cuando hay conexión
- ✅ Detección automática de estado online/offline

**Detalles técnicos:**

- Base de datos: IndexedDB (via `idb`)
- Service Worker: `public/sw.js`
- Backup: localStorage (feeds únicamente)

---

### 8.2. Recuperación de Datos

**Descripción:** Sistema resiliente ante pérdida de datos.

**Funcionalidades:**

- ✅ Backup automático de feeds a localStorage
- ✅ Restauración automática si IndexedDB se limpia
- ✅ Detección de pérdida de datos
- ✅ Reintento de descarga de feeds
- ✅ Logging de eventos de DB

**Detalles técnicos:**

- Monitor: `db-monitor.ts`
- Eventos monitorizados: deletes, clears, errors

---

## Gestión de Caché

### 9.1. Caché de Modelos de IA

**Descripción:** Gestiona el almacenamiento de modelos de Transformers.js.

**Funcionalidades:**

- ✅ Ver modelos descargados
- ✅ Ver espacio usado por modelo
- ✅ Eliminar modelos individuales
- ✅ Limpiar toda la caché
- ✅ Pre-cargar modelos
- ✅ Indicador de descarga con progreso

**Detalles técnicos:**

- Storage: Cache API
- Componente: `CacheManager`
- Namespace: `transformers-cache`

---

### 9.2. Gestión de Artículos

**Descripción:** Limpia artículos antiguos para liberar espacio.

**Funcionalidades:**

- ✅ Ver cantidad de artículos por feed
- ✅ Ver espacio estimado usado
- ✅ Eliminar artículos antiguos (por feed o global)
- ✅ Mantener artículos favoritos
- ✅ Estimación de espacio a liberar

**Detalles técnicos:**

- Componente: `CacheManager`
- Estrategia: Eliminar por fecha, preservando favoritos

---

## Monitorización y Debugging

### 10.1. Activity Status

**Descripción:** Sistema de tracking de actividades en progreso.

**Funcionalidades:**

- ✅ Indicadores visuales de actividades activas
- ✅ Tipos: fetching-rss, scraping, summarizing
- ✅ Contador de actividades simultáneas
- ✅ Detalles por actividad (feed, artículo)
- ✅ Panel lateral expandible

**Detalles técnicos:**

- Context: `ActivityStatusContext`
- Hook: `useActivityStatus()`

---

### 10.2. Database Monitoring

**Descripción:** Logs de eventos de IndexedDB para debugging.

**Funcionalidades:**

- ✅ Log de operaciones de DB
- ✅ Detección de eliminaciones inesperadas
- ✅ Tracking de errores
- ✅ Historial de eventos
- ✅ Vista en sidebar (developer mode)

**Detalles técnicos:**

- Módulo: `db-monitor.ts`
- Storage: array en memoria (limitado)

---

### 10.3. Error Handling

**Descripción:** Sistema robusto de manejo de errores.

**Funcionalidades:**

- ✅ UserError para errores esperados
- ✅ Toast notifications para feedback
- ✅ Logging a consola para debugging
- ✅ Mensajes descriptivos en español
- ✅ Reintentos automáticos con backoff
- ✅ Fallbacks para operaciones críticas

**Detalles técnicos:**

- Toast library: Sonner
- Estrategia: throw UserError para errores de usuario, Error para bugs

---

## Funcionalidades Adicionales

### 11.1. Tutoriales Interactivos

**Funcionalidades:**

- ✅ Tutorial guiado para nuevos usuarios
- ✅ Explicación de funcionalidades principales
- ✅ Capturas de pantalla ilustrativas
- ✅ Navegación paso a paso

**Ruta:** `/tutorial`

---

### 11.2. Página de Ayuda

**Funcionalidades:**

- ✅ FAQ completo
- ✅ Guía de uso
- ✅ Troubleshooting
- ✅ Información sobre IA

**Ruta:** `/help`

---

### 11.3. Responsive Design

**Funcionalidades:**

- ✅ Layout adaptativo (mobile, tablet, desktop)
- ✅ Sidebar colapsable en móvil
- ✅ Touch gestures
- ✅ Optimización de rendimiento móvil

---

### 11.4. SEO y Meta Tags

**Funcionalidades:**

- ✅ Meta tags optimizados
- ✅ Open Graph tags
- ✅ Twitter cards
- ✅ Sitemap dinámico
- ✅ robots.txt
- ✅ Manifest para PWA

---

### 11.5. Accesibilidad

**Funcionalidades:**

- ✅ Navegación por teclado
- ✅ ARIA labels
- ✅ Contraste adecuado en todos los temas
- ✅ Focus visible
- ✅ Screen reader friendly

---

### 11.6. Internacionalización

**Funcionalidades:**

- ✅ Soporte multi-idioma
- ✅ Detección de idioma del navegador
- ✅ Formateo de fechas localizado
- ✅ Traducción de interfaz

**Idiomas soportados:**

- Español (principal)
- Inglés
- Catalán

---

## Métricas de Rendimiento

### Optimizaciones Implementadas:

- ✅ Lazy loading de componentes pesados
- ✅ Code splitting automático (Next.js)
- ✅ Virtualización de listas largas
- ✅ Optimización de imágenes (Sharp → WebP)
- ✅ Web Workers para IA
- ✅ Debouncing de búsquedas
- ✅ Memoización con useMemo/useCallback
- ✅ Prefetching de rutas (Next.js)

---

## Roadmap de Funcionalidades

### En Desarrollo:

- [ ] Exportar/importar feeds (OPML)
- [ ] Compartir artículos
- [ ] Sincronización entre dispositivos
- [ ] PWA instalable
- [ ] Notificaciones push para nuevos artículos
- [ ] Modo lectura con TTS (text-to-speech)
- [ ] Categorización automática de feeds
- [ ] Estadísticas de lectura

### Propuestas Futuras:

- [ ] Integración con servicios de bookmarking
- [ ] Extensión de navegador
- [ ] App móvil nativa
- [ ] Sincronización P2P
- [ ] Plugin system para extensibilidad
