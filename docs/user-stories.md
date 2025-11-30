# Historias de Usuario - RSS Reader Antigravity

## Gestión de Feeds

### HU-001: Añadir un nuevo feed RSS

**Como** usuario  
**Quiero** poder añadir un nuevo feed RSS mediante URL  
**Para** seguir las noticias de mis fuentes favoritas

**Criterios de aceptación:**

- [ ] El usuario puede abrir el diálogo "Add Feed"
- [ ] El usuario puede introducir una URL de feed RSS válida
- [ ] El sistema valida y añade el feed correctamente
- [ ] El feed aparece en la lista del sidebar
- [ ] Se muestra una notificación de éxito

**Pruebas realizadas:**

- [x] La Vanguardia (https://www.lavanguardia.com/rss/home.xml) - ✅ Añadido como "Portada"
- [x] El País (https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada) - ✅ Añadido
- [ ] El Periódico - Pendiente
- [ ] eldiario.es - Ya existía

---

### HU-002: Seleccionar preset de feed popular

**Como** usuario  
**Quiero** poder seleccionar feeds de una lista de presets populares  
**Para** añadir rápidamente fuentes conocidas sin buscar la URL

**Criterios de aceptación:**

- [ ] El diálogo muestra un selector de presets
- [ ] Los presets incluyen feeds populares
- [ ] Al seleccionar un preset, se autocompleta la URL

---

### HU-003: Eliminar un feed

**Como** usuario  
**Quiero** poder eliminar un feed de mi lista  
**Para** dejar de seguir fuentes que ya no me interesan

**Criterios de aceptación:**

- [ ] Cada feed tiene un botón de eliminar (X)
- [ ] Se pide confirmación antes de eliminar
- [ ] El feed se elimina de la lista y de IndexedDB

---

### HU-004: Ver todos los artículos

**Como** usuario  
**Quiero** poder ver todos los artículos de todos mis feeds  
**Para** tener una vista consolidada de todas las noticias

**Criterios de aceptación:**

- [ ] Existe un botón "All Articles"
- [ ] Al pulsarlo, se muestran artículos de todos los feeds

---

## Lectura de Artículos

### HU-005: Ver lista de artículos de un feed

**Como** usuario  
**Quiero** ver la lista de artículos de un feed seleccionado  
**Para** explorar las noticias disponibles

**Criterios de aceptación:**

- [ ] Al seleccionar un feed, se muestra la lista de artículos
- [ ] Cada artículo muestra título, fecha y extracto
- [ ] Se indica el número total de artículos

---

### HU-006: Leer un artículo completo

**Como** usuario  
**Quiero** poder leer el contenido completo de un artículo  
**Para** acceder a la información sin salir de la app

**Criterios de aceptación:**

- [ ] Al pulsar "Read" se abre el artículo
- [ ] El contenido se muestra de forma legible
- [ ] Se puede hacer scraping del contenido original si es necesario

---

### HU-013: Generar resúmenes con IA

**Como** usuario  
**Quiero** poder generar un resumen de un artículo con IA y elegir entre varias longitudes (short, medium, long, extended)  
**Para** obtener una versión condensada del contenido según mi preferencia

**Criterios de aceptación:**

- [ ] Existe un botón para generar el resumen con IA
- [ ] El usuario puede elegir la longitud del resumen (`short`, `medium`, `long`, `extended`)
- [ ] El resumen se genera localmente en el navegador (Transformers.js) y se guarda en IndexedDB cuando se solicite
- [ ] Si el resumen se genera en inglés y la traducción automática está habilitada, se traduce a español
- [ ] El usuario puede borrar el resumen cacheado

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
