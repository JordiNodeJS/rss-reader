# Historias de Usuario - RSS Reader Antigravity

> Historias de usuario completas organizadas por épicas funcionales. Prioridad: 🔴 Alta | 🟡 Media | 🟢 Baja

## Índice de Épicas

1. [Gestión de Feeds](#épica-1-gestión-de-feeds)
2. [Lectura de Artículos](#épica-2-lectura-de-artículos)
3. [Web Scraping](#épica-3-web-scraping)
4. [Resúmenes con IA](#épica-4-resúmenes-con-ia)
5. [Búsqueda y Filtrado](#épica-5-búsqueda-y-filtrado)
6. [Favoritos](#épica-6-favoritos)
7. [Personalización](#épica-7-personalización)
8. [Modo Offline](#épica-8-modo-offline)
9. [Gestión de Caché](#épica-9-gestión-de-caché)

---

## Épica 1: Gestión de Feeds

### HU-001: Añadir feed RSS mediante URL 🔴

**Como** usuario  
**Quiero** poder añadir un nuevo feed RSS mediante su URL  
**Para** seguir las noticias de mis fuentes favoritas sin salir de la aplicación

**Criterios de aceptación:**

- ✅ El usuario puede abrir el diálogo "Add Feed" mediante botón en el sidebar
- ✅ El usuario puede introducir una URL de feed RSS o Atom válida
- ✅ El sistema valida la URL en el servidor (proxy para evitar CORS)
- ✅ El sistema parsea el feed y extrae metadatos (título, descripción, icono)
- ✅ El feed se guarda en IndexedDB con todos sus artículos
- ✅ El feed aparece en la lista del sidebar inmediatamente
- ✅ Se muestra un toast de éxito con el nombre del feed añadido
- ✅ Se guarda un backup en localStorage para recuperación
- ✅ Si el feed ya existe, se muestra error descriptivo

**Escenarios de prueba:**

- [x] Añadir El País: `https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada`
- [x] Añadir La Vanguardia: `https://www.lavanguardia.com/rss/home.xml`
- [x] Intentar añadir URL duplicada → debe mostrar error
- [x] Añadir URL inválida → debe mostrar error descriptivo
- [x] Probar con feed Atom además de RSS

**Valor de negocio:** Permite a los usuarios crear su biblioteca personalizada de fuentes

**Estimación:** 5 puntos (completado)

---

### HU-002: Añadir feed desde presets populares 🟡

**Como** usuario  
**Quiero** poder seleccionar feeds de una lista de presets populares  
**Para** añadir rápidamente fuentes conocidas sin buscar la URL manualmente

**Criterios de aceptación:**

- ✅ El diálogo de "Add Feed" muestra un selector de presets
- ✅ Los presets incluyen al menos 20 feeds populares españoles
- ✅ Al seleccionar un preset, se autocompleta la URL en el campo
- ✅ Los presets están organizados por categorías (general, deportes, tecnología, etc.)
- ✅ El usuario puede editar la URL después de seleccionar un preset
- ✅ Se puede buscar dentro de los presets

**Categorías de presets:**

- Portadas generales
- Deportes
- Tecnología
- Cultura
- Economía
- Internacional

**Valor de negocio:** Reduce fricción para nuevos usuarios al descubrir feeds

**Estimación:** 3 puntos (completado)

---

### HU-003: Eliminar un feed 🔴

**Como** usuario  
**Quiero** poder eliminar un feed de mi lista  
**Para** dejar de seguir fuentes que ya no me interesan y liberar espacio

**Criterios de aceptación:**

- ✅ Cada feed tiene un botón de eliminar (icono X) en el sidebar
- ✅ Se pide confirmación antes de eliminar (dialog con mensaje claro)
- ✅ Al confirmar, se eliminan el feed y TODOS sus artículos asociados de IndexedDB
- ✅ El feed desaparece inmediatamente del sidebar
- ✅ Se actualiza el backup de localStorage
- ✅ Se muestra toast confirmando la eliminación
- ✅ Si hay artículos del feed abiertos, se cierra la vista

**Escenarios de prueba:**

- [x] Eliminar feed sin artículos
- [x] Eliminar feed con 100+ artículos
- [x] Cancelar eliminación
- [x] Eliminar mientras se lee un artículo del feed

**Valor de negocio:** Permite gestionar la biblioteca y liberar espacio

**Estimación:** 2 puntos (completado)

---

### HU-004: Actualizar feeds manualmente 🔴

**Como** usuario  
**Quiero** poder actualizar mis feeds manualmente  
**Para** obtener los artículos más recientes cuando lo desee

**Criterios de aceptación:**

- ✅ Existe un botón "Refresh All" en la barra superior del sidebar
- ✅ Cada feed individual tiene un botón de refresh
- ✅ Al actualizar, se muestra indicador visual de progreso
- ✅ Solo se descargan artículos nuevos (compara GUIDs)
- ✅ Se muestra el número de artículos nuevos en toast
- ✅ Si hay error, se reintenta hasta 3 veces con backoff
- ✅ Los errores se muestran con mensajes descriptivos
- ✅ La actualización funciona en background sin bloquear la UI

**Indicadores visuales:**

- Spinner en el botón durante la actualización
- Barra de progreso si actualiza múltiples feeds
- Activity status en el sidebar

**Valor de negocio:** Control total sobre cuándo consumir datos/recursos

**Estimación:** 5 puntos (completado)

---

### HU-005: Reordenar feeds mediante drag & drop 🟡

**Como** usuario  
**Quiero** poder reordenar mis feeds arrastrándolos  
**Para** organizar mis fuentes según mis preferencias

**Criterios de aceptación:**

- ✅ Los feeds se pueden arrastrar y soltar en el sidebar
- ✅ Se muestra feedback visual durante el arrastre
- ✅ El orden se guarda inmediatamente en IndexedDB
- ✅ El orden persiste entre sesiones
- ✅ No se puede arrastrar fuera del área de feeds
- ✅ Funciona en desktop (mouse) y tablet/móvil (touch)

**Valor de negocio:** Mejora la UX permitiendo personalización

**Estimación:** 3 puntos (completado)

---

### HU-006: Marcar feeds como favoritos 🟢

**Como** usuario  
**Quiero** marcar feeds importantes como favoritos  
**Para** identificarlos rápidamente en mi lista

**Criterios de aceptación:**

- ✅ Cada feed tiene un icono de estrella
- ✅ Al hacer clic, toggle entre favorito/no favorito
- ✅ Los feeds favoritos tienen un indicador visual distintivo
- ✅ El estado se guarda en IndexedDB
- ✅ Se puede filtrar para ver solo feeds favoritos (futuro)

**Valor de negocio:** Mejora la organización visual

**Estimación:** 2 puntos (completado)

---

### HU-007: Editar nombre personalizado del feed 🟡

**Como** usuario  
**Quiero** poder cambiar el nombre de visualización de un feed  
**Para** personalizarlo según mis preferencias

**Criterios de aceptación:**

- ✅ Doble clic en el nombre del feed para editar
- ✅ Campo de texto inline para edición
- ✅ Guardar con Enter o perdida de foco
- ✅ Cancelar con Escape
- ✅ Se guarda como `customTitle` en IndexedDB
- ✅ Fallback al título original si se borra el customTitle
- ✅ Validación: no permitir nombres vacíos

**Valor de negocio:** Personalización avanzada

**Estimación:** 2 puntos (completado)

---

## Épica 2: Lectura de Artículos

### HU-008: Ver todos los artículos en lista 🔴

**Como** usuario  
**Quiero** ver una lista consolidada de todos mis artículos  
**Para** explorar contenido de todas mis fuentes en un solo lugar

**Criterios de aceptación:**

- ✅ Vista por defecto muestra "Todos los artículos"
- ✅ Cada artículo muestra: título, extracto, fecha, fuente, miniatura
- ✅ Los artículos están ordenados por fecha (más recientes primero)
- ✅ Se muestra contador total de artículos
- ✅ Scroll infinito con virtualización para listas grandes
- ✅ Loading skeletons mientras carga
- ✅ Indicador visual de artículos no leídos (opcional futuro)

**Elementos visuales:**

- Tarjetas compactas con thumbnail a la izquierda
- Fecha relativa ("hace 2 horas")
- Badge con nombre del feed
- Hover effect

**Valor de negocio:** Vista principal de la app, UX central

**Estimación:** 5 puntos (completado)

---

### HU-009: Ver artículos de un feed específico 🔴

**Como** usuario  
**Quiero** ver solo los artículos de un feed seleccionado  
**Para** concentrarme en una fuente particular

**Criterios de aceptación:**

- ✅ Al hacer clic en un feed del sidebar, se filtran artículos
- ✅ El header muestra el nombre del feed seleccionado
- ✅ Se muestra contador de artículos del feed
- ✅ El feed seleccionado tiene indicador visual en el sidebar
- ✅ Botón para volver a "Todos los artículos"
- ✅ La selección persiste en la sesión (no entre recargas)

**Valor de negocio:** Navegación intuitiva por fuentes

**Estimación:** 3 puntos (completado)

---

### HU-010: Leer artículo en vista completa 🔴

**Como** usuario  
**Quiero** poder leer el contenido completo de un artículo  
**Para** consumir la noticia sin salir de la aplicación

**Criterios de aceptación:**

- ✅ Al hacer clic en "Read" se abre modal a pantalla completa
- ✅ El modal muestra: título, autor, fecha, fuente, contenido
- ✅ El contenido HTML está sanitizado para seguridad
- ✅ Las imágenes se cargan optimizadas (WebP si disponible)
- ✅ Botón para ver artículo original en nueva pestaña
- ✅ Botón de cerrar (X) y atajo de teclado (Escape)
- ✅ El componente se carga lazy para optimizar rendimiento
- ✅ Loading spinner mientras carga el componente

**Navegación:**

- Scroll suave dentro del modal
- Preserva posición del scroll en la lista al cerrar

**Valor de negocio:** Experiencia de lectura premium

**Estimación:** 5 puntos (completado)

---

### HU-011: Abrir artículo original en navegador 🟢

**Como** usuario  
**Quiero** poder abrir el artículo original en el sitio web  
**Para** ver el contenido completo o interactuar con el sitio

**Criterios de aceptación:**

- ✅ Botón "Ver original" visible en vista de artículo
- ✅ Abre enlace en nueva pestaña del navegador
- ✅ Usa `rel="noopener noreferrer"` para seguridad
- ✅ Preserva el contexto de la app (no cierra el modal)

**Valor de negocio:** Acceso al contenido original cuando se necesite

**Estimación:** 1 punto (completado)

---

## Épica 3: Web Scraping

### HU-012: Extraer contenido completo de artículo 🔴

**Como** usuario  
**Quiero** poder extraer el contenido completo de un artículo con texto parcial  
**Para** leer la noticia completa sin salir de la aplicación

**Criterios de aceptación:**

- ✅ Botón "Scrape" visible en artículos con contenido limitado
- ✅ Al hacer clic, se inicia proceso de scraping con indicador visual
- ✅ El sistema intenta con Mozilla Readability primero
- ✅ Si falla, usa Cheerio con selectores específicos del sitio
- ✅ Se descargan y optimizan las imágenes (conversión a WebP)
- ✅ El contenido scrapeado se guarda en IndexedDB
- ✅ Se muestra toast de éxito/error con detalles
- ✅ Activity status muestra progreso en sidebar
- ✅ El artículo muestra badge "Saved" después del scraping

**Sitios con soporte optimizado:**

- El País, La Vanguardia, El Confidencial, ABC, RTVE, eldiario.es, etc.

**Detalles técnicos:**

- Timeout: 30 segundos
- Reintentos: 2 intentos en caso de error de red
- Storage: campo `scrapedContent` en article

**Valor de negocio:** Experiencia de lectura completa sin depender de feeds limitados

**Estimación:** 8 puntos (completado)

---

### HU-013: Eliminar contenido scrapeado 🟡

**Como** usuario  
**Quiero** poder eliminar el contenido scrapeado de un artículo  
**Para** liberar espacio en el almacenamiento local

**Criterios de aceptación:**

- ✅ Botón "Unsave" visible en artículos con contenido scrapeado
- ✅ Al hacer clic, elimina el `scrapedContent` de IndexedDB
- ✅ El artículo vuelve a mostrar el contenido RSS original
- ✅ Se actualiza el badge a estado normal
- ✅ Se muestra toast confirmando la acción
- ✅ Libera espacio inmediatamente

**Valor de negocio:** Control sobre el uso de almacenamiento

**Estimación:** 2 puntos (completado)

---

## Épica 4: Resúmenes con IA

### HU-014: Generar resumen local con Transformers.js 🔴

**Como** usuario  
**Quiero** generar resúmenes automáticos de artículos usando IA local  
**Para** obtener el contenido clave sin compartir datos con servicios externos

**Criterios de aceptación:**

- ✅ Botón "Summarize" en vista de artículo
- ✅ Dialog de configuración con opciones de longitud (short/medium/long/extended)
- ✅ Dialog muestra opciones de tipo (tl;dr, key-points, teaser, headline)
- ✅ Se muestra disclaimer explicando el uso de IA local
- ✅ Durante generación, muestra progress indicator con estimación
- ✅ El resumen se genera en Web Worker (no bloquea UI)
- ✅ Se puede cancelar la generación en curso
- ✅ El resumen generado se muestra en card especial
- ✅ Los resúmenes se guardan en IndexedDB para reutilización
- ✅ Funciona 100% offline después de descargar modelo

**Modelos soportados:**

- DistilBART-CNN-12-6 (default, ~300MB)
- BART-Large-CNN (mejor calidad, ~1.6GB)
- T5-Small (~240MB)

**Opciones de personalización:**

- Longitudes: 50-500 palabras
- Formatos: párrafo, bullet points, etc.
- Idioma: auto-detectado

**Valor de negocio:** Funcionalidad premium sin dependencias cloud

**Estimación:** 13 puntos (completado)

---

### HU-015: Generar resumen con Chrome Summarizer API 🟡

**Como** usuario con Chrome 128+  
**Quiero** usar la API nativa de Chrome para resúmenes  
**Para** obtener resúmenes de alta calidad sin descargar modelos manualmente

**Criterios de aceptación:**

- ✅ Detección automática de disponibilidad de Chrome AI
- ✅ Si está disponible, se ofrece como opción preferida
- ✅ Muestra estado de descarga del modelo (si Chrome lo está descargando)
- ✅ Streaming de resultados en tiempo real
- ✅ Fallback automático a Transformers.js si no está disponible
- ✅ Menor latencia que Transformers.js
- ✅ Mismo formato de salida que otros proveedores

**Requisitos:**

- Chrome 128+ con flags habilitados
- `chrome://flags/#optimization-guide-on-device-model`
- `chrome://flags/#prompt-api-for-gemini-nano`

**Valor de negocio:** Mejor UX en Chrome sin overhead de descarga

**Estimación:** 5 puntos (completado)

---

### HU-016: Generar resumen con Google Gemini API 🟡

**Como** usuario  
**Quiero** usar Google Gemini API para resúmenes de máxima calidad  
**Para** obtener mejores resultados en artículos complejos

**Criterios de aceptación:**

- ✅ Opción "Gemini (Cloud)" en selector de proveedor
- ✅ Dialog para configurar API Key de Google AI Studio
- ✅ Validación de API Key antes de guardar
- ✅ Storage seguro de API Key en localStorage
- ✅ Rate limiting visual (15 req/min)
- ✅ Manejo de errores de cuota/red
- ✅ Fallback a local si falla
- ✅ Botón para limpiar API Key
- ✅ Link a documentación de cómo obtener API Key

**Limitaciones:**

- Requiere conexión a internet
- Sujeto a límites de cuota de Google
- No funciona offline

**Valor de negocio:** Máxima calidad para usuarios que lo necesiten

**Estimación:** 5 puntos (completado)

---

### HU-017: Gestionar caché de modelos de IA 🟢

**Como** usuario  
**Quiero** ver y gestionar los modelos de IA descargados  
**Para** controlar el uso de almacenamiento y pre-cargar modelos

**Criterios de aceptación:**

- ✅ Panel "Cache Manager" en configuración
- ✅ Lista de modelos descargados con tamaño
- ✅ Botón para eliminar cada modelo
- ✅ Botón "Clear All" para limpiar toda la caché
- ✅ Botón para pre-cargar modelo específico
- ✅ Progress bar durante descarga
- ✅ Estimación de espacio total usado
- ✅ Información de qué modelo está en uso

**Valor de negocio:** Transparencia y control sobre recursos

**Estimación:** 3 puntos (completado)

---

### HU-018: Seleccionar modelo de IA 🟢

**Como** usuario avanzado  
**Quiero** elegir qué modelo de IA usar para resúmenes  
**Para** optimizar calidad vs. velocidad/tamaño según mis necesidades

**Criterios de aceptación:**

- ✅ Selector de modelo en AIDisclaimer
- ✅ Muestra nombre, tamaño, y descripción de cada modelo
- ✅ Indica cuál está descargado/activo
- ✅ Cambio de modelo reinicia el worker
- ✅ Preferencia persiste entre sesiones

**Modelos disponibles:**

- DistilBART (balanced)
- BART-Large (best quality)
- T5-Small (fastest)

**Valor de negocio:** Personalización avanzada para power users

**Estimación:** 2 puntos (completado)

---

## Épica 5: Búsqueda y Filtrado

### HU-019: Buscar artículos por texto 🔴

**Como** usuario  
**Quiero** buscar artículos por palabras clave  
**Para** encontrar noticias específicas rápidamente

**Criterios de aceptación:**

- ✅ Campo de búsqueda en header de artículos
- ✅ Búsqueda en tiempo real (sin necesidad de Enter)
- ✅ Busca en título y extracto del artículo
- ✅ Case-insensitive
- ✅ Muestra contador de resultados
- ✅ Preserva otros filtros activos
- ✅ Debounce de 300ms para optimizar rendimiento
- ✅ Funciona offline (búsqueda local)
- ✅ Placeholder con ejemplo de búsqueda

**Mejoras futuras:**

- Resaltado de términos encontrados
- Búsqueda fuzzy
- Búsqueda en contenido scrapeado

**Valor de negocio:** Navegación eficiente en bibliotecas grandes

**Estimación:** 3 puntos (completado)

---

### HU-020: Ordenar artículos 🟡

**Como** usuario  
**Quiero** ordenar artículos por fecha  
**Para** ver primero los más recientes o los más antiguos según prefiera

**Criterios de aceptación:**

- ✅ Selector dropdown con opciones "Más recientes" / "Más antiguos"
- ✅ Orden por defecto: más recientes
- ✅ Cambio de orden reactivo instantáneo
- ✅ Funciona con búsqueda y otros filtros
- ✅ Indicador visual del orden actual

**Opciones futuras:**

- Ordenar por fuente
- Ordenar alfabéticamente
- Ordenar por artículos leídos/no leídos

**Valor de negocio:** Flexibilidad en la navegación

**Estimación:** 2 puntos (completado)

---

### HU-021: Filtrar por feed específico 🔴

**Como** usuario  
**Quiero** ver artículos de un solo feed  
**Para** concentrarme en una fuente específica

**Criterios de aceptación:**

- ✅ Click en feed del sidebar filtra artículos
- ✅ Header muestra nombre del feed seleccionado
- ✅ Contador de artículos del feed activo
- ✅ Feed seleccionado resaltado en sidebar
- ✅ Botón/Click en "All Articles" resetea filtro
- ✅ Compatible con búsqueda y ordenación

**Valor de negocio:** Navegación intuitiva por fuentes

**Estimación:** 2 puntos (completado)

---

## Épica 6: Favoritos

### HU-022: Marcar artículo como favorito 🟡

**Como** usuario  
**Quiero** marcar artículos importantes como favoritos  
**Para** acceder rápidamente a contenido que quiero conservar

**Criterios de aceptación:**

- ✅ Botón de corazón en cada tarjeta de artículo
- ✅ Toggle con un solo clic
- ✅ Feedback visual inmediato (corazón relleno/vacío)
- ✅ Se guarda en IndexedDB (`article.isFavorite`)
- ✅ Sincronización entre lista y vista de artículo
- ✅ Animación suave en toggle
- ✅ Color distintivo (rojo) para favoritos

**Valor de negocio:** Curación personal de contenido

**Estimación:** 2 puntos (completado)

---

### HU-023: Ver solo artículos favoritos 🟡

**Como** usuario  
**Quiero** filtrar para ver solo mis artículos favoritos  
**Para** revisar rápidamente contenido guardado

**Criterios de aceptación:**

- ✅ Botón "Favoritos" en header
- ✅ Toggle activa/desactiva filtro
- ✅ Estilo distintivo cuando está activo
- ✅ Contador de favoritos
- ✅ Compatible con búsqueda y ordenación
- ✅ Estado se resetea al cambiar de feed

**Escenarios:**

- Ver favoritos + buscar dentro de ellos
- Ver favoritos de un feed específico
- Ver todos los favoritos de todas las fuentes

**Valor de negocio:** Acceso rápido a contenido curado

**Estimación:** 2 puntos (completado)

---

### HU-024: Marcar feed como favorito 🟢

**Como** usuario  
**Quiero** marcar feeds importantes como favoritos  
**Para** identificarlos rápidamente en el sidebar

**Criterios de aceptación:**

- ✅ Icono de estrella en cada feed
- ✅ Toggle con un clic
- ✅ Indicador visual en feeds favoritos
- ✅ Persiste en IndexedDB

**Mejoras futuras:**

- Sección separada para feeds favoritos
- Filtrar por feeds favoritos

**Valor de negocio:** Organización visual mejorada

**Estimación:** 1 punto (completado)

---

## Épica 7: Personalización

### HU-025: Cambiar tema de color 🔴

**Como** usuario  
**Quiero** personalizar el tema visual de la aplicación  
**Para** adaptar la interfaz a mi estilo y preferencias

**Criterios de aceptación:**

- ✅ Selector de tema accesible desde header
- ✅ 50+ temas prediseñados disponibles
- ✅ Preview del tema antes de aplicarlo
- ✅ Cambio instantáneo sin recarga de página
- ✅ Persistencia en localStorage
- ✅ No hay flash de contenido sin estilo (FOUC)
- ✅ Temas organizados por categorías
- ✅ Búsqueda de temas por nombre
- ✅ Carrusel de demos con screenshots

**Categorías de temas:**

- Minimalistas (clean-slate, modern-minimal, mono)
- Oscuros (doom-64, darkmatter, midnight-bloom)
- Coloridos (bubblegum, candyland, synthwave)
- Profesionales (graphite, elegant-luxury)
- Naturales (kodama-grove, sakura)
- Inspirados (catppuccin, claude, vscode-dark)

**Valor de negocio:** Diferenciador clave, alta personalización

**Estimación:** 8 puntos (completado)

---

### HU-026: Ajustar ancho del sidebar 🟢

**Como** usuario  
**Quiero** ajustar el ancho del sidebar  
**Para** optimizar el espacio según mi pantalla y preferencias

**Criterios de aceptación:**

- ✅ Divisor resizable entre sidebar y contenido
- ✅ Drag del divisor ajusta ancho
- ✅ Límites mín/máx de ancho
- ✅ Cursor apropiado en hover
- ✅ Ancho persiste en cookies/localStorage
- ✅ Funciona en desktop (no en móvil)

**Valor de negocio:** Flexibilidad de layout

**Estimación:** 3 puntos (completado)

---

### HU-027: Colapsar/expandir sidebar en móvil 🟡

**Como** usuario móvil  
**Quiero** colapsar el sidebar  
**Para** ver más contenido en pantallas pequeñas

**Criterios de aceptación:**

- ✅ Botón hamburger en header (móvil)
- ✅ Sidebar overlay en móvil
- ✅ Cierre con tap fuera del sidebar
- ✅ Animación suave de apertura/cierre
- ✅ Estado no persiste (siempre cerrado al cargar en móvil)

**Valor de negocio:** UX móvil optimizada

**Estimación:** 3 puntos (completado)

---

### HU-028: Controlar animaciones 🟢

**Como** usuario  
**Quiero** pausar/reanudar animaciones  
**Para** reducir distracciones o consumo de recursos

**Criterios de aceptación:**

- ✅ Hook `useAnimationPause()` disponible
- ✅ Contexto global de pausa de animaciones
- ✅ Componentes respetan el estado de pausa
- ✅ Botón toggle en settings (futuro)

**Valor de negocio:** Accesibilidad y control de recursos

**Estimación:** 2 puntos (parcial)

---

## Épica 8: Modo Offline

### HU-029: Acceder a feeds sin conexión 🔴

**Como** usuario  
**Quiero** leer mis artículos sin conexión a internet  
**Para** consumir contenido en cualquier situación

**Criterios de aceptación:**

- ✅ Todos los feeds y artículos se guardan en IndexedDB
- ✅ La app funciona completamente offline después de la primera carga
- ✅ Service Worker cachea assets estáticos
- ✅ Se puede leer contenido scrapeado offline
- ✅ Indicador de estado online/offline
- ✅ Resúmenes locales funcionan offline

**Limitaciones offline:**

- No se pueden añadir nuevos feeds
- No se pueden actualizar feeds existentes
- Gemini API no funciona (fallback a local)

**Valor de negocio:** USP clave, productividad sin conexión

**Estimación:** 8 puntos (completado)

---

### HU-030: Sincronizar al volver online 🟡

**Como** usuario  
**Quiero** que la app se sincronice automáticamente al recuperar conexión  
**Para** tener siempre contenido actualizado

**Criterios de aceptación:**

- ✅ Detección de cambio de estado online/offline
- ✅ Auto-refresh de feeds al volver online (opcional)
- ✅ Notificación de sincronización
- ✅ No interrumpe la lectura actual

**Mejoras futuras:**

- Queue de acciones pendientes mientras offline
- Sincronización inteligente por prioridad

**Valor de negocio:** Experiencia fluida multi-dispositivo

**Estimación:** 5 puntos (parcial)

---

### HU-031: Recuperar datos borrados 🔴

**Como** usuario  
**Quiero** que mis feeds se recuperen si se borra IndexedDB  
**Para** no perder mi configuración

**Criterios de aceptación:**

- ✅ Backup automático de feeds a localStorage
- ✅ Detección de IndexedDB vacía al iniciar
- ✅ Restauración automática desde localStorage
- ✅ Notificación de recuperación
- ✅ Re-descarga de artículos de feeds restaurados
- ✅ Logging de eventos de borrado para debugging

**Escenarios de pérdida:**

- Limpieza manual de IndexedDB en DevTools
- Presión de almacenamiento del navegador
- Bug que corrompe la DB

**Valor de negocio:** Resiliencia y confianza del usuario

**Estimación:** 5 puntos (completado)

---

## Épica 9: Gestión de Caché

### HU-032: Ver espacio usado por la app 🟢

**Como** usuario  
**Quiero** ver cuánto espacio está usando la aplicación  
**Para** decidir si necesito limpiar datos

**Criterios de aceptación:**

- ✅ Panel "Cache Manager" muestra espacio total
- ✅ Desglose por categoría (modelos IA, artículos, imágenes)
- ✅ Formato legible (MB/GB)
- ✅ Estimaciones precisas

**Valor de negocio:** Transparencia sobre uso de recursos

**Estimación:** 2 puntos (completado)

---

### HU-033: Limpiar artículos antiguos 🟡

**Como** usuario  
**Quiero** eliminar artículos antiguos  
**Para** liberar espacio de almacenamiento

**Criterios de aceptación:**

- ✅ Opción en Cache Manager
- ✅ Selector de antigüedad (>30 días, >60 días, >90 días)
- ✅ Preview de cuántos artículos se eliminarán
- ✅ Confirmación antes de eliminar
- ✅ Preserva artículos favoritos
- ✅ Muestra espacio liberado

**Mejoras futuras:**

- Limpieza automática programada
- Eliminar por feed específico

**Valor de negocio:** Gestión de almacenamiento sostenible

**Estimación:** 5 puntos (parcial)

---

### HU-034: Exportar/importar configuración 🟢

**Como** usuario  
**Quiero** exportar mi lista de feeds  
**Para** hacer backup o migrar a otro dispositivo

**Criterios de aceptación:**

- [ ] Botón "Export OPML" en settings
- [ ] Genera archivo OPML estándar
- [ ] Botón "Import OPML" para importar
- [ ] Validación de archivo importado
- [ ] Opción de merge o replace feeds
- [ ] Incluye feeds favoritos y orden

**Estándar:**

- Formato OPML 2.0
- Compatible con otros lectores RSS

**Valor de negocio:** Portabilidad y backup

**Estimación:** 5 puntos (pendiente)

---

## Épica 10: Accesibilidad y UX

### HU-035: Navegar con teclado 🟡

**Como** usuario  
**Quiero** navegar la app usando solo el teclado  
**Para** mayor eficiencia y accesibilidad

**Criterios de aceptación:**

- ✅ Tab navega entre elementos interactivos
- ✅ Enter/Space activa botones
- ✅ Escape cierra modales
- ✅ Arrows navegan listas (futuro)
- ✅ Focus visible en todos los elementos
- ✅ No hay trampas de teclado

**Atajos futuros:**

- `/` para focus en búsqueda
- `j`/`k` para navegar artículos
- `r` para refresh
- `?` para mostrar atajos

**Valor de negocio:** Accesibilidad y productividad

**Estimación:** 3 puntos (parcial)

---

### HU-036: Soporte para lectores de pantalla 🟢

**Como** usuario con discapacidad visual  
**Quiero** usar la app con lector de pantalla  
**Para** acceder al contenido

**Criterios de aceptación:**

- ✅ Todos los elementos tienen ARIA labels apropiados
- ✅ Estructura semántica correcta (headings, landmarks)
- ✅ Anuncios de cambios dinámicos (live regions)
- ✅ Texto alternativo en imágenes
- ✅ Estados de botones anunciados

**Valor de negocio:** Inclusividad y cumplimiento de WCAG

**Estimación:** 5 puntos (parcial)

---

### HU-037: Tutorial para nuevos usuarios 🟡

**Como** nuevo usuario  
**Quiero** un tutorial interactivo  
**Para** aprender a usar la aplicación rápidamente

**Criterios de aceptación:**

- ✅ Página `/tutorial` con guía paso a paso
- ✅ Capturas de pantalla ilustrativas
- ✅ Explicación de funcionalidades clave
- ✅ Link desde landing page
- ✅ Se puede saltar o completar

**Valor de negocio:** Onboarding mejorado, menor abandono

**Estimación:** 3 puntos (completado)

---

### HU-038: Página de ayuda y FAQ 🟡

**Como** usuario  
**Quiero** acceder a una página de ayuda  
**Para** resolver dudas sin soporte externo

**Criterios de aceptación:**

- ✅ Página `/help` accesible desde header
- ✅ FAQ con preguntas comunes
- ✅ Guías de uso por funcionalidad
- ✅ Troubleshooting de problemas comunes
- ✅ Información sobre modelos de IA
- ✅ Links a documentación técnica

**Valor de negocio:** Reducción de fricción, autonomía del usuario

**Estimación:** 3 puntos (completado)

---

## Épica 11: Rendimiento y Optimización

### HU-039: Carga rápida inicial 🔴

**Como** usuario  
**Quiero** que la app cargue rápidamente  
**Para** acceder al contenido sin esperas

**Criterios de aceptación:**

- ✅ Time to Interactive < 3s en 4G
- ✅ Lazy loading de componentes pesados
- ✅ Code splitting automático
- ✅ Prefetching de rutas
- ✅ Loading skeletons durante carga
- ✅ Service Worker cachea assets

**Métricas objetivo:**

- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1

**Valor de negocio:** Retención de usuarios, SEO

**Estimación:** 8 puntos (completado)

---

### HU-040: Scroll suave en listas largas 🟡

**Como** usuario  
**Quiero** que las listas de artículos se desplacen suavemente  
**Para** una experiencia fluida incluso con muchos artículos

**Criterios de aceptación:**

- ✅ Virtualización de listas con 100+ artículos
- ✅ 60 FPS durante scroll
- ✅ No hay lag al filtrar/buscar
- ✅ Lazy loading de imágenes

**Técnicas:**

- Intersection Observer para imágenes
- React virtualization (futuro)
- Debouncing de eventos

**Valor de negocio:** UX premium en bibliotecas grandes

**Estimación:** 5 puntos (parcial)

---

## Resumen de Implementación

### Completadas: ✅ 35 historias

### En Progreso: 🟡 5 historias

### Pendientes: 🔴 5 historias (futuras épicas)

---

## Backlog Futuro

### Épica 12: Compartir y Colaboración

- HU-041: Compartir artículo en redes sociales
- HU-042: Copiar enlace del artículo
- HU-043: Compartir feed con otros usuarios

### Épica 13: PWA y Móvil

- HU-044: Instalar como PWA
- HU-045: Notificaciones push de nuevos artículos
- HU-046: App móvil nativa (iOS/Android)

### Épica 14: Análisis y Estadísticas

- HU-047: Ver estadísticas de lectura
- HU-048: Tiempo promedio de lectura
- HU-049: Feeds más leídos
- HU-050: Tendencias de contenido

### Épica 15: Extensibilidad

- HU-051: Sistema de plugins
- HU-052: API pública para integraciones
- HU-053: Webhooks para eventos

---

## Notas para Desarrollo

### Convenciones de Prioridad:

- 🔴 Alta: Funcionalidad core, bloqueante
- 🟡 Media: Mejora significativa de UX
- 🟢 Baja: Nice-to-have, optimizaciones

### Criterios de Completitud:

- Todos los criterios de aceptación cumplidos
- Tests E2E pasando (cuando aplicable)
- Documentación actualizada
- Sin bugs críticos conocidos

### Template para Nuevas Historias:

```markdown
### HU-XXX: [Título] [Prioridad]

**Como** [rol]
**Quiero** [acción]
**Para** [beneficio]

**Criterios de aceptación:**

- [ ] Criterio 1
- [ ] Criterio 2

**Valor de negocio:** [Explicación]
**Estimación:** X puntos
```

**Como** usuario  
**Quiero** poder generar un resumen de un artículo con IA y elegir entre varias longitudes (short, medium, long, extended)  
**Para** obtener una versión condensada del contenido según mi preferencia

**Criterios de aceptación:**

- [ ] Existe un botón para generar el resumen con IA
- [ ] El usuario puede elegir la longitud del resumen (`short`, `medium`, `long`, `extended`)
- [ ] El resumen se genera localmente en el navegador (Transformers.js) y se guarda en IndexedDB cuando se solicite
- [ ] Si el resumen se genera en inglés y la traducción automática está habilitada, se traduce a español
- [ ] El usuario puede borrar el resumen cacheado
- [ ] El usuario puede ver y limpiar modelos descargados en el diálogo "Caché de Modelos IA" (Traducción y Resumen)
- [ ] El usuario ve progreso de descarga al generarse o bajar un modelo y puede cancelar la descarga
- [ ] El usuario puede eliminar (limpiar) los modelos descargados para liberar espacio

### HU-007: Guardar artículo como favorito

**Como** usuario  
**Quiero** poder guardar artículos como favoritos  
**Para** acceder a ellos más tarde

**Criterios de aceptación:**

- [ ] Cada artículo tiene un botón "Save"
- [ ] Los artículos guardados se marcan visualmente
- [ ] Se puede filtrar por artículos guardados

---

### HU-008: Buscar artículos

**Como** usuario  
**Quiero** poder buscar artículos por texto  
**Para** encontrar noticias específicas rápidamente

**Criterios de aceptación:**

- [ ] Existe un campo de búsqueda
- [ ] Los resultados se filtran en tiempo real
- [ ] La búsqueda funciona por título y contenido

---

### HU-009: Ordenar artículos

**Como** usuario  
**Quiero** poder ordenar los artículos  
**Para** ver las noticias en el orden que prefiera

**Criterios de aceptación:**

- [ ] Existe un selector de ordenación
- [ ] Se puede ordenar por fecha (más nuevos/más antiguos)

---

## Funcionalidades del Sistema

### HU-010: Limpiar caché

**Como** usuario  
**Quiero** poder limpiar la caché de la aplicación  
**Para** liberar espacio o resolver problemas

**Criterios de aceptación:**

- [ ] Existe un botón "Clear Cache"
- [ ] Se pide confirmación antes de limpiar
- [ ] Se eliminan todos los datos de IndexedDB

---

### HU-011: Cambiar tema (claro/oscuro)

**Como** usuario  
**Quiero** poder cambiar entre tema claro y oscuro  
**Para** adaptar la interfaz a mis preferencias visuales

**Criterios de aceptación:**

- [ ] Existe un botón de toggle de tema
- [ ] El cambio es inmediato
- [ ] La preferencia se guarda

---

### HU-012: Funcionamiento offline

**Como** usuario  
**Quiero** que la app funcione sin conexión  
**Para** leer artículos guardados cuando no tenga internet

**Criterios de aceptación:**

- [ ] Los feeds y artículos se almacenan en IndexedDB
- [ ] La app es accesible sin conexión
- [ ] Los artículos scrapeados están disponibles offline

---

## Feeds de Prueba - Periódicos Españoles

| Periódico     | URL RSS                                                          | Estado       |
| ------------- | ---------------------------------------------------------------- | ------------ |
| elDiario.es   | https://www.eldiario.es/rss/                                     | ✅ Añadido   |
| La Vanguardia | https://www.lavanguardia.com/rss/home.xml                        | ✅ Añadido   |
| El País       | https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada | ✅ Añadido   |
| El Periódico  | https://www.elperiodico.com/es/rss/rss_portada.xml               | ✅ Añadido   |
| El Mundo      | https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml             | 🔄 Pendiente |
| ABC           | https://www.abc.es/rss/feeds/abcPortada.xml                      | 🔄 Pendiente |
| 20 Minutos    | https://www.20minutos.es/rss/                                    | 🔄 Pendiente |
| Público       | https://www.publico.es/rss                                       | 🔄 Pendiente |

---

## Historial de Pruebas

### Sesión de prueba: 2024-XX-XX

1. **Añadir La Vanguardia** - ✅ PASS

   - URL: https://www.lavanguardia.com/rss/home.xml
   - Resultado: Feed añadido correctamente como "Portada"

2. **Añadir El País** - ✅ PASS

   - URL: https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada
   - Resultado: Feed añadido correctamente como "EL PAÍS: el periódico global"

3. **Añadir El Periódico** - ✅ PASS

   - URL: https://www.elperiodico.com/es/rss/rss_portada.xml
   - Resultado: Feed añadido correctamente como "El Periódico - portada"

4. **Seleccionar feed El País y ver artículos** - ✅ PASS

   - Feed seleccionado correctamente
   - Muestra 140 artículos disponibles
   - Fechas se muestran correctamente (ej: "24 nov 2025, 21:50")

5. **Buscar artículos con texto "Trump"** - ✅ PASS

   - Campo de búsqueda funciona correctamente
   - Filtra de 140 a 7 artículos que contienen "Trump"
   - Filtrado en tiempo real

6. **Guardar artículo como favorito** - ✅ PASS

   - Botón "Save" inicia scraping del contenido
   - Artículo se marca como "Saved"
   - Botón cambia a estado deshabilitado

7. **Leer artículo guardado** - ✅ PASS
   - Abre modal con contenido completo
   - Muestra etiqueta "Offline Ready"
   - Contenido scrapeado correctamente con autor, fecha, texto completo
   - Enlace "Visit Original" disponible
   - Botón "Close" funciona correctamente
