# Historias de Usuario - RSS Reader Antigravity

## Epic 1: Gestión de Feeds

### US-1.1: Añadir nuevo feed RSS
**Como** usuario  
**Quiero** poder añadir un nuevo feed RSS mediante su URL  
**Para** suscribirme a nuevas fuentes de noticias

**Criterios de aceptación:**
- [ ] Puedo hacer clic en el botón "Add Feed"
- [ ] Se abre un diálogo para introducir la URL del feed
- [ ] Al confirmar, el feed se añade a la lista de feeds
- [ ] Los artículos del feed se cargan y muestran automáticamente
- [ ] Se muestra mensaje de error si la URL no es válida

### US-1.2: Ver lista de feeds suscritos
**Como** usuario  
**Quiero** ver todos mis feeds suscritos en una barra lateral  
**Para** navegar fácilmente entre mis fuentes

**Criterios de aceptación:**
- [ ] Los feeds aparecen en la barra lateral izquierda
- [ ] Cada feed muestra su nombre/título
- [ ] Puedo hacer clic en un feed para filtrar sus artículos

### US-1.3: Eliminar un feed
**Como** usuario  
**Quiero** poder eliminar un feed de mi lista  
**Para** dejar de seguir fuentes que ya no me interesan

**Criterios de aceptación:**
- [ ] Puedo eliminar un feed haciendo clic en el botón de eliminar
- [ ] Se solicita confirmación antes de eliminar
- [ ] Los artículos del feed se eliminan de la vista
- [ ] El feed desaparece de la barra lateral

### US-1.4: Ver todos los artículos
**Como** usuario  
**Quiero** poder ver todos los artículos de todos mis feeds juntos  
**Para** tener una vista unificada de todas las noticias

**Criterios de aceptación:**
- [ ] Existe un botón "All Articles"
- [ ] Al hacer clic, muestra artículos de todos los feeds
- [ ] Se indica el contador total de artículos

---

## Epic 2: Lectura de Artículos

### US-2.1: Ver lista de artículos
**Como** usuario  
**Quiero** ver una lista de artículos con su título, fecha y resumen  
**Para** escanear rápidamente las noticias disponibles

**Criterios de aceptación:**
- [ ] Cada artículo muestra su título
- [ ] Se muestra la fecha de publicación formateada
- [ ] Se muestra un extracto/resumen del contenido
- [ ] Los artículos aparecen en tarjetas visuales

### US-2.2: Leer contenido completo (Scraping)
**Como** usuario  
**Quiero** leer el contenido completo de un artículo  
**Para** consumir la noticia sin salir de la aplicación

**Criterios de aceptación:**
- [ ] Existe un botón "Read" en cada artículo
- [ ] Al hacer clic, se hace scraping del contenido original
- [ ] El contenido se muestra de forma limpia y legible
- [ ] Las imágenes del artículo se cargan correctamente

### US-2.3: Guardar artículo para después
**Como** usuario  
**Quiero** poder guardar artículos interesantes  
**Para** leerlos más tarde

**Criterios de aceptación:**
- [ ] Existe un botón "Save" en cada artículo
- [ ] El artículo guardado muestra un badge "Saved"
- [ ] El botón cambia a estado deshabilitado tras guardar
- [ ] Puedo filtrar para ver solo artículos guardados

### US-2.4: Filtrar artículos guardados
**Como** usuario  
**Quiero** ver solo mis artículos guardados  
**Para** acceder fácilmente a contenido que quiero leer

**Criterios de aceptación:**
- [ ] Existe un toggle o pestaña "Saved"
- [ ] Al activarlo, solo se muestran artículos guardados
- [ ] Se indica el número de artículos guardados

---

## Epic 3: Búsqueda y Ordenación

### US-3.1: Buscar artículos
**Como** usuario  
**Quiero** buscar artículos por texto  
**Para** encontrar noticias sobre temas específicos

**Criterios de aceptación:**
- [ ] Existe un campo de búsqueda
- [ ] Al escribir, se filtran artículos por título/contenido
- [ ] La búsqueda es instantánea (sin necesidad de botón)
- [ ] Se muestra mensaje si no hay resultados

### US-3.2: Ordenar artículos
**Como** usuario  
**Quiero** ordenar artículos por fecha  
**Para** ver los más recientes o más antiguos primero

**Criterios de aceptación:**
- [ ] Existe un selector de ordenación
- [ ] Opción "Newest first" muestra los más recientes primero
- [ ] Opción "Oldest first" muestra los más antiguos primero
- [ ] El orden se aplica inmediatamente

---

## Epic 4: Preferencias de Usuario

### US-4.1: Cambiar tema visual
**Como** usuario  
**Quiero** poder alternar entre tema claro y oscuro  
**Para** adaptar la interfaz a mi preferencia visual

**Criterios de aceptación:**
- [ ] Existe un botón de cambio de tema
- [ ] Al hacer clic, alterna entre claro y oscuro
- [ ] La preferencia persiste entre sesiones

### US-4.2: Limpiar caché
**Como** usuario  
**Quiero** poder limpiar los datos almacenados  
**Para** liberar espacio o empezar de nuevo

**Criterios de aceptación:**
- [ ] Existe un botón "Clear Cache"
- [ ] Se solicita confirmación antes de proceder
- [ ] Al confirmar, se eliminan feeds y artículos
- [ ] La interfaz se actualiza mostrando estado vacío

---

## Epic 5: Estado del Sistema

### US-5.1: Ver estado de conexión
**Como** usuario  
**Quiero** saber si la aplicación está online/offline  
**Para** entender si puedo cargar contenido nuevo

**Criterios de aceptación:**
- [ ] Se muestra indicador de estado "ONLINE" u "OFFLINE"
- [ ] El indicador refleja el estado de conexión real
- [ ] La app funciona offline con contenido cacheado

---

## Feeds RSS de Prueba

| Periódico | URL RSS |
|-----------|---------|
| La Vanguardia | https://www.lavanguardia.com/rss/home.xml |
| El País | https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada |
| El Periódico | https://www.elperiodico.com/es/rss/portada/rss.xml |
| elDiario.es | https://www.eldiario.es/rss/ |

---

*Documento generado para pruebas de QA - RSS Reader Antigravity*
