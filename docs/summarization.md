# Summarization — Guía de Desarrolladores

> Guia técnica para integradores y desarrolladores sobre el sistema de resúmenes con IA.

## Índice

- Introducción
- Arquitectura (Chrome Summarizer vs Transformers.js)
- APIs públicas y utilidades (preload, status, clear, terminate)
- Uso en App: hooks y UI
- Cache y Storage (IndexedDB, Cache API)
- E2E / QA — Qué probar
- Debugging y troubleshooting
- Rendimiento y recomendaciones
- Modelos disponibles y trade-offs

---

## Introducción

Esta guía describe las API públicas y los patrones de uso para la funcionalidad de resúmenes con IA del proyecto. La app ofrece:

- Resúmenes locales usando Transformers.js (por defecto) como fallback cross-browser
- Integración con la API nativa de Chrome (cuando está disponible)
- Longitudes: `short`, `medium`, `long`, `extended` (más detallado)
- Tipos: `tldr`, `key-points`, `teaser`, `headline`

Todo el comportamiento y utilidades principales están expuestos desde `src/lib/summarization.ts` y `src/lib/summarization-transformers.ts`.

---

## Arquitectura: Chrome vs Transformers.js

- Chrome Summarizer API (Gemini Nano / Built-in AI)

  - Alta calidad, modelo gestionado por Chrome, streaming nativo y descarga gestionada por navegador.
  - Uso recomendado: si `Translator` / `Summarizer` es detectado (Chrome 138+, API disponible) se intenta usar primero.

- Transformers.js fallback
  - Cross-browser: funciona en Chrome, Firefox, Edge y Safari.
  - Modelos disponibles y cuantizados para optimizar tamaño/velocidad.
  - Ejecuta la inferencia dentro de un Web Worker para evitar bloquear el hilo principal.

---

## APIs públicas y utilidades

Las siguentes exports están disponibles en `src/lib/summarization.ts`:

- `summarizeWithTransformers(text, options)` — Genera resumen con Transformers.js
- `preloadSummarizationModel(modelId?, onProgress?)` — Pre-carga modelos en el worker (recomendado antes de generar el primer resumen en conexiones lentas)
- `getSummarizationModelStatus()` — Devuelve `isLoading`, `isLoaded`, `modelId` y métricas sencillas
- `terminateSummarizationWorker()` — Termina el worker para liberar memoria y limpiar solicitudes pendientes
- `getCachedSummarizationModels()` — Lista modelos guardados en la Cache API
- `clearSummarizationModelCache()` — Elimina modelos de la Cache API (y termina el worker)
- `getSummarizationCacheSize()` — Devuelve el tamaño total en bytes de los modelos guardados en la Cache API
- `isTransformersSummarizationAvailable()` — Booleano de disponibilidad de Transformers.js
- `SUMMARIZATION_MODELS` — Objeto con los modelos configurados y metadatos (`name`, `size`, `id`)

### Ejemplo rápido (import)

```ts
import {
  preloadSummarizationModel,
  getSummarizationModelStatus,
  clearSummarizationModelCache,
  terminateSummarizationWorker,
  summarizeWithTransformers,
} from "@/lib/summarization";
```

### Ejemplo de pre-carga

```ts
// Precargar modelo distilbart para acelerar la primera resumida
await preloadSummarizationModel("distilbart-cnn-12-6", (progress) => {
  console.log("Progreso de carga del modelo:", progress);
});

// Consultar estado del modelo
const status = await getSummarizationModelStatus();
console.log(status);
```

### Limpiar cache y terminar worker

```ts
await clearSummarizationModelCache();
// clearSummarizationModelCache() termina el worker internamente
// pero puedes terminarlo manualmente
terminateSummarizationWorker();
```

---

## Uso dentro de la App (hooks y UI)

- Hook recomendado: `src/hooks/useSummary.ts` — envoltorio para crear resúmenes, gestionar estado, persistencia en IndexedDB y traducir mediante `translation` si procede.
- UI principal: `src/components/articles/ArticleView.tsx` usa `useSummary` con opciones como `translateSummary` y `summaryLength`.
- Admin UI: `src/components/CacheManager.tsx` — panel para listar/limpiar modelos descargados (Traducción + Resumen) y ver su tamaño.

### Ejemplo: uso en `useSummary`

```tsx
const summaryHook = useSummary({
  articleId,
  summaryLength: "extended",
  translateSummary: true,
});

summaryHook
  .generate("tldr", "extended")
  .then(() => console.log("Resumen listo"));
```

---

## Cache y Storage

- Resúmenes por artículo: se guardan en IndexedDB (usando `src/lib/db.ts`) como parte del objeto `Article`. Esto permite lectura offline y reutilización sin re-computar.
- Modelos Transformers.js: se guardan en la Cache API bajo un `TRANSFORMERS_CACHE_NAME`. Esto reduce ancho de banda y tiempos de carga posteriores.
- Traducciones de Chrome: Gestionadas por Chrome (no accesible para borrar desde la web fácilmente), pero la app ofrece una acción para guiar al usuario (`chrome://on-device-translation-internals/`).

### Limpieza

- Para limpiar los modelos cacheados en la Cache API: `clearSummarizationModelCache()`.
- El UI `CacheManager` proporciona botones y diálogos para limpiar cachés y ver los modelos actuales.

---

## E2E / QA — Qué probar

1. Generación de resumen básica

   - Generar `short`, `medium`, `long`, `extended` en un artículo; validar que el tamaño y el tipo concuerdan con la longitud solicitada.
   - Para `extended`, validar que se generan 7–10 oraciones o ~10+ bullet points si se solicita `key-points`.

2. Cache y persistencia

   - Generar un resumen y verificar que se guarda en IndexedDB para el `article` asociado.
   - Limpiar la caché desde `CacheManager` y verificar que la lista se actualiza y los modelos desaparecen.

3. Precarga (Preload)

   - Usa `preloadSummarizationModel()` y valida que el primer resumen posterior sea más rápido y que `getSummarizationModelStatus()` refleje `isLoaded`.
   - Cancela/aborta una descarga (si la UI lo expone) y valida que la descarga se detenga.

4. Worker lifecycle

   - Verificar que la terminación del worker (`terminateSummarizationWorker`) libera memoria y que `getSummarizationModelStatus()` retorna `isLoaded` false.
   - `clearSummarizationModelCache()` debe terminar el worker internamente.

5. Chrome API fallback
   - Si Chrome Summarizer está disponible, valida que se use preferentemente y que el resultado sea coherente.

---

## Debugging y troubleshooting

- Logs: Las funciones en `src/lib/summarization-transformers.ts` y el worker emiten `console.debug`/`console.error` para seguimiento. Usa DevTools y `list_console_messages` si ejecutas pruebas automatizadas.
- Status checks: `getSummarizationModelStatus()` devuelve estado del model y te ayuda a diagnosticar si el modelo está en `isLoading`/`isLoaded`/`error`.
- Espacio: `getSummarizationCacheSize()` devuelve espacio ocupado por los modelos en la Cache API.
- Worker hang: si detectas que la app está consumiendo mucha memoria o hay un worker colgado, usa `terminateSummarizationWorker()` y recarga UI.
- Errores comunes:
  - `Transformers.js` no disponible: revisar `isTransformersSummarizationAvailable()` y fallback a Chrome API.
  - Descarga de modelos fallida por CORS o network: asegúrate que los modelos estén configurados en `SUMMARIZATION_MODELS` y que la URL sea accesible.

---

## Rendimiento y recomendaciones

- Preload / Prefetch: Llamar a `preloadSummarizationModel()` en segundo plano cuando la app se inicializa o en el onboarding permite que la primera interacción sea más rápida.
- Model sizing: Usa vs `distilbart` si prefieres rapidez; BART más grande si priorizas calidad. Ver `SUMMARIZATION_MODELS` para opciones.
- Indicadores de progreso: Mostrar porcentaje de descarga y permitir cancelar mejora UX en conexiones lentas.
- Worker memory: Para dispositivos móviles, considera descargar modelos más ligeros o permitir al usuario deshabilitar resúmenes.
- UX: Si el usuario habilita `auto-translate`, correr la detección de idioma y traducir solo cuando sea necesario para ahorrar CPU.

---

## Modelos recomendados y trade-offs

- `distilbart-cnn-12-6`: Balance velocidad/calidad, buen default
- `bart-large` / `bart-large-cnn`: Mejor calidad, mayor tiempo y espacio
- Otros (NLLB / custom): valores para multilenguaje con mayor espacio de disco

El archivo `src/lib/summarization-models.ts` describe los modelos y tamaños. Para tests o desarrollo, usar `distilbart-cnn-12-6`.

---

## Notas finales

- Si necesitas añadir soporte para nuevos modelos o formas de inferencia (p. ej., WebLLM, ONNX con WebGPU), agrega el modelo a `SUMMARIZATION_MODELS` y prueba la estrategia de pre-carga y cacheo.
- Recuerda que `CacheManager` es el punto de entrada de la UI para supervisar y limpiar modelos en producción.

¡Listo! Si quieres que añada ejemplos E2E concretos (Playwright) o un snippet para un `useEffect` que pre-cargue modelos en el onboarding, dímelo y lo añado.
