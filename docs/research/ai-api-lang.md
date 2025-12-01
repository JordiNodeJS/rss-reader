# Investigación: APIs de Traducción con LLM Local en el Navegador

> **Objetivo**: Implementar traducción de inglés a español para artículos RSS utilizando modelos de IA que se ejecutan localmente en el navegador, sin necesidad de servidores externos.

## Resumen Ejecutivo

Existen tres enfoques principales para traducción on-device en el navegador:

| Enfoque                    | Soporte               | Tamaño Modelo          | Calidad         | Recomendación                     |
| -------------------------- | --------------------- | ---------------------- | --------------- | --------------------------------- |
| **Chrome Translator API**  | Chrome 138+           | ~50-100MB (gestionado) | Excelente       | ✅ Principal                      |
| **Transformers.js (ONNX)** | Todos los navegadores | ~75-600MB              | Buena-Excelente | ✅ Fallback                       |
| **WebLLM**                 | WebGPU requerido      | ~2-8GB                 | Regular         | ❌ No recomendado para traducción |

---

## 1. Chrome Built-in AI APIs

### 1.1 Translator API (Chrome 138+)

Chrome ha implementado una **API nativa de traducción** que utiliza modelos optimizados ejecutados en el dispositivo. Esta es la opción más eficiente para usuarios de Chrome.

#### Compatibilidad de Navegadores

| Navegador   | Soporte         |
| ----------- | --------------- |
| Chrome 138+ | ✅ Soportado    |
| Edge        | ❌ No soportado |
| Firefox     | ❌ No soportado |
| Safari      | ❌ No soportado |

#### Características Clave

- **Traducción on-device**: No requiere servidor, todo se procesa localmente
- **Privacidad**: El contenido nunca sale del dispositivo
- **Modelo experto**: Optimizado específicamente para traducción
- **Streaming**: Soporte para textos largos con traducción progresiva
- **Paquetes de idiomas**: Se descargan bajo demanda

#### Detección de Disponibilidad

```typescript
// Verificar si la API está disponible
if ("Translator" in self) {
  // Verificar disponibilidad del par de idiomas
  const availability = await Translator.availability({
    sourceLanguage: "en",
    targetLanguage: "es",
  });

  // Valores posibles:
  // - 'available': Listo para usar
  // - 'downloadable': Necesita descargar el modelo
  // - 'downloading': Descargando actualmente
  // - 'unavailable': No disponible para este par de idiomas
}
```

#### Ejemplo de Uso Completo

```typescript
async function translateWithChromeAPI(text: string): Promise<string> {
  // 1. Verificar disponibilidad
  const availability = await Translator.availability({
    sourceLanguage: "en",
    targetLanguage: "es",
  });

  if (availability === "unavailable") {
    throw new Error("Traducción EN→ES no disponible");
  }

  // 2. Crear traductor con monitoreo de descarga
  const translator = await Translator.create({
    sourceLanguage: "en",
    targetLanguage: "es",
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        const percent = Math.round(e.loaded * 100);
        console.log(`Descargando modelo: ${percent}%`);
      });
    },
  });

  // 3. Traducir texto
  const translated = await translator.translate(text);
  return translated;
}

// Para textos largos, usar streaming
async function translateLongText(text: string): Promise<string> {
  const translator = await Translator.create({
    sourceLanguage: "en",
    targetLanguage: "es",
  });

  const stream = translator.translateStreaming(text);
  let result = "";

  for await (const chunk of stream) {
    result = chunk; // Cada chunk contiene la traducción acumulada
  }

  return result;
}
```

### 1.2 Language Detector API (Chrome 138+)

Esencial para detectar si un artículo RSS está en inglés antes de traducirlo:

```typescript
async function detectLanguage(
  text: string
): Promise<{ language: string; confidence: number }> {
  if (!("LanguageDetector" in self)) {
    throw new Error("Language Detector API no disponible");
  }

  const detector = await LanguageDetector.create();
  const results = await detector.detect(text);

  // Retorna lista ordenada por confianza:
  // [{ detectedLanguage: 'en', confidence: 0.95 }, { detectedLanguage: 'de', confidence: 0.03 }, ...]

  return {
    language: results[0]?.detectedLanguage || "unknown",
    confidence: results[0]?.confidence || 0,
  };
}

// Uso para determinar si traducir
async function shouldTranslate(articleText: string): Promise<boolean> {
  const { language, confidence } = await detectLanguage(articleText);
  return language === "en" && confidence > 0.7;
}
```

### Ventajas y Desventajas de Chrome APIs

**Pros:**

- ✅ Sin descarga adicional para usuarios (modelo gestionado por el navegador)
- ✅ Aceleración por hardware (GPU/NPU optimizado)
- ✅ Máxima privacidad (on-device)
- ✅ Alta calidad de traducción (modelo experto)
- ✅ Soporte de streaming para textos largos
- ✅ Estandarización W3C en progreso

**Contras:**

- ❌ Solo Chrome (por ahora)
- ❌ Requiere descarga inicial del paquete de idiomas
- ❌ No disponible en Web Workers (por ahora)

---

## 2. Transformers.js con Modelos ONNX

**Transformers.js** de Hugging Face es la solución más madura para ejecutar modelos ML en el navegador con compatibilidad cross-browser.

### 2.1 Compatibilidad

| Navegador | WebAssembly | WebGPU           |
| --------- | ----------- | ---------------- |
| Chrome    | ✅          | ✅               |
| Edge      | ✅          | ✅               |
| Firefox   | ✅          | 🔄 (behind flag) |
| Safari    | ✅          | ❌               |

### 2.2 Modelos Recomendados para Traducción EN→ES

| Modelo                               | Tamaño (ONNX) | Calidad   | Velocidad | Recomendación      |
| ------------------------------------ | ------------- | --------- | --------- | ------------------ |
| `Xenova/opus-mt-en-es`               | ~75MB         | Buena     | Rápida    | ✅ **Recomendado** |
| `Xenova/marian-finetuned-kde4-en-es` | ~75MB         | Buena     | Rápida    | ✅ Alternativa     |
| `Xenova/nllb-200-distilled-600M`     | ~600MB        | Excelente | Moderada  | Para multi-idioma  |

### 2.3 Instalación

```bash
pnpm add @huggingface/transformers
```

### 2.4 Ejemplo de Uso con Opus-MT

```typescript
import { pipeline, env } from "@huggingface/transformers";

// Configurar caché local
env.cacheDir = "./.cache/transformers";
env.allowLocalModels = true;

// Inicializar traductor (descarga modelo en primer uso)
const translator = await pipeline("translation", "Xenova/opus-mt-en-es", {
  device: "webgpu", // Usa WebGPU si está disponible, fallback a WASM
  dtype: "q8", // Modelo cuantizado para menor tamaño
});

// Traducir texto
const result = await translator("The latest news from around the world");
console.log(result[0].translation_text);
// Output: "Las últimas noticias de todo el mundo"
```

### 2.5 Traducción de Artículos Largos

Para artículos RSS que pueden ser extensos:

```typescript
async function translateArticle(text: string): Promise<string> {
  const translator = await pipeline("translation", "Xenova/opus-mt-en-es", {
    dtype: "q8",
  });

  // Dividir por oraciones para mejor calidad
  const sentences = text.split(/(?<=[.!?])\s+/);
  const translated: string[] = [];

  for (const sentence of sentences) {
    if (sentence.trim()) {
      const result = await translator(sentence);
      translated.push(result[0].translation_text);
    }
  }

  return translated.join(" ");
}
```

### 2.6 NLLB-200 para Soporte Multi-idioma

Si en el futuro se necesitan más pares de idiomas:

```typescript
import { pipeline } from "@huggingface/transformers";

const translator = await pipeline(
  "translation",
  "Xenova/nllb-200-distilled-600M"
);

// Inglés a Español
const enToEs = await translator("Life is like a box of chocolates.", {
  src_lang: "eng_Latn", // English (Latin script)
  tgt_lang: "spa_Latn", // Spanish (Latin script)
});

// Francés a Español
const frToEs = await translator("La vie est belle.", {
  src_lang: "fra_Latn",
  tgt_lang: "spa_Latn",
});
```

### Ventajas y Desventajas de Transformers.js

**Pros:**

- ✅ Compatibilidad cross-browser
- ✅ Modelos de alta calidad disponibles
- ✅ Aceleración WebGPU
- ✅ Modelos cuantizados (q4, q8) reducen tamaño
- ✅ Comunidad activa y actualizaciones frecuentes
- ✅ Funciona en Web Workers

**Contras:**

- ❌ Descarga inicial del modelo (75-600MB según modelo)
- ❌ Overhead de memoria (~200MB-1GB RAM)
- ❌ Más lento que la API nativa de Chrome

---

## 3. WebLLM

**WebLLM** es un motor de inferencia LLM de alto rendimiento en el navegador usando WebGPU.

### ¿Por qué NO se recomienda para traducción?

| Aspecto            | WebLLM                 | Modelos Especializados     |
| ------------------ | ---------------------- | -------------------------- |
| Tamaño             | 2-8GB                  | 75-600MB                   |
| Calidad traducción | Regular                | Buena-Excelente            |
| Memoria RAM        | 4GB+                   | 200MB-1GB                  |
| Especialización    | General (chat, código) | Optimizado para traducción |

### Cuándo usar WebLLM

- Si necesitas **múltiples funciones AI** (resumen, chat, traducción) con un solo modelo
- Si la **calidad de traducción no es crítica**
- Si los usuarios tienen **hardware potente**

---

## 4. Comparativa de Rendimiento

| Solución                  | Tamaño Modelo          | RAM    | Primera Traducción | Subsecuentes | Calidad    |
| ------------------------- | ---------------------- | ------ | ------------------ | ------------ | ---------- |
| Chrome Translator API     | ~50-100MB (gestionado) | Bajo   | ~500ms             | ~50-100ms    | ⭐⭐⭐⭐⭐ |
| Opus-MT (Transformers.js) | ~75MB                  | ~300MB | ~2-3s              | ~200-500ms   | ⭐⭐⭐⭐   |
| NLLB-200-distilled        | ~600MB                 | ~800MB | ~5-8s              | ~500ms-1s    | ⭐⭐⭐⭐⭐ |
| WebLLM (Llama-3)          | ~2-4GB                 | ~4GB+  | ~30-60s            | ~1-3s        | ⭐⭐⭐     |

---

## 5. Implementación Recomendada: Enfoque Híbrido

Para el RSS Reader, se recomienda un enfoque híbrido que:

1. Use la API de Chrome cuando esté disponible (mejor rendimiento)
2. Caiga a Transformers.js para otros navegadores
3. Cachée las traducciones en IndexedDB

### Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                    TranslationService                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  Language   │    │  Chrome         │    │ Transformers │  │
│  │  Detector   │───▶│  Translator API │───▶│ .js Fallback │  │
│  └─────────────┘    └─────────────────┘    └─────────────┘  │
│         │                   │                     │          │
│         ▼                   ▼                     ▼          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  IndexedDB Cache                      │   │
│  │  (translatedTitle, translatedContent, translatedAt)   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Traducción

```
1. Usuario abre artículo
2. ¿Existe traducción en caché?
   ├─ Sí → Mostrar traducción cacheada
   └─ No → Continuar
3. Detectar idioma del artículo
   ├─ No es inglés → No traducir
   └─ Es inglés → Continuar
4. ¿Chrome Translator API disponible?
   ├─ Sí → Usar Chrome API
   └─ No → Usar Transformers.js
5. Guardar traducción en IndexedDB
6. Mostrar traducción al usuario
```

---

## 6. Extensión del Esquema IndexedDB

Para cachear traducciones, añadir campos al esquema de artículos:

```typescript
interface Article {
  id: string;
  title: string;
  content: string;
  // ... campos existentes

  // Nuevos campos de traducción
  translatedTitle?: string;
  translatedContent?: string;
  translationLanguage?: string; // 'es', 'fr', etc.
  translatedAt?: number; // timestamp
  originalLanguage?: string; // idioma detectado
}
```

---

## 7. Consideraciones de UX

### 7.1 Descarga de Modelos

- Mostrar indicador de progreso durante la descarga inicial
- Permitir cancelar la descarga
- Cachear el modelo para uso futuro

### 7.2 Estados de UI

```typescript
type TranslationStatus =
  | "idle" // No se ha solicitado traducción
  | "detecting" // Detectando idioma
  | "downloading" // Descargando modelo (primera vez)
  | "translating" // Traduciendo contenido
  | "completed" // Traducción completada
  | "error"; // Error en la traducción
```

### 7.3 Toggle de Traducción

- Botón para alternar entre original y traducido
- Indicar claramente qué versión se está viendo
- Mantener scroll position al cambiar

---

## Summarization (Resúmenes con IA)

La aplicación implementa resúmenes con IA que se ejecutan en el navegador; esta sección cubre las opciones y tradeoffs entre usar APIs nativas (Chrome) o soluciones cross-browser (Transformers.js).

### Opciones disponibles

- **Chrome Summarizer API**: API nativa (Chrome 138+) con modelos optimizados, descarga controlada y streaming nativo. Adecuada para usuarios Chrome que buscan rendimiento y privacidad.
- **Transformers.js**: Fallback cross-browser con modelos como DistilBART (`distilbart-cnn-12-6`) para asegurar compatibilidad y funcionalidad en la mayoría de navegadores.

### Longitudes y tipos

- `short`, `medium`, `long` y `extended` — `extended` produce resúmenes más completos para lectura rápida y comprensión (7-10 oraciones o 10+ bullet points para `key-points`).
- `type`: `tldr`, `key-points`, `teaser`, `headline`.
- `format`: `markdown`, `plain-text`.

### UX / Performance

- Indicar la descarga del modelo y progreso la primera vez que se utiliza Transformers.js.
- Cachear resúmenes en IndexedDB para mejorar la experiencia en dispositivos con recursos limitados.
- Ofrecer opción de elegir modelo o deshabilitar resúmenes para ahorrar ancho de banda y CPU.

### Recomendación de implementación

1. **Primero**: Intentar usar Chrome Summarizer API si está disponible (mejor rendimiento y streaming).
2. **Fallback**: Transformers.js con un modelo DistilBART para compatibilidad cross-browser.
3. **Cache**: Almacenar resúmenes en IndexedDB y permitir al usuario limpiar el caché.

---

## 8. TypeScript Types

Para soporte TypeScript de Chrome AI APIs:

```bash
pnpm add -D @anthropic-ai/browser-ai-types  # o similar
```

O declarar tipos manualmente:

```typescript
// types/chrome-ai.d.ts
declare global {
  interface TranslatorAvailabilityOptions {
    sourceLanguage: string;
    targetLanguage: string;
  }

  interface TranslatorCreateOptions extends TranslatorAvailabilityOptions {
    monitor?: (monitor: TranslatorMonitor) => void;
  }

  interface TranslatorMonitor extends EventTarget {
    addEventListener(
      type: "downloadprogress",
      listener: (event: TranslatorDownloadProgressEvent) => void
    ): void;
  }

  interface TranslatorDownloadProgressEvent extends Event {
    loaded: number;
    total: number;
  }

  interface Translator {
    translate(text: string): Promise<string>;
    translateStreaming(text: string): ReadableStream<string>;
    destroy(): void;
  }

  interface TranslatorConstructor {
    availability(
      options: TranslatorAvailabilityOptions
    ): Promise<"available" | "downloadable" | "downloading" | "unavailable">;
    create(options: TranslatorCreateOptions): Promise<Translator>;
  }

  interface LanguageDetectorResult {
    detectedLanguage: string;
    confidence: number;
  }

  interface LanguageDetector {
    detect(text: string): Promise<LanguageDetectorResult[]>;
    destroy(): void;
  }

  interface LanguageDetectorConstructor {
    availability(): Promise<
      "available" | "downloadable" | "downloading" | "unavailable"
    >;
    create(): Promise<LanguageDetector>;
  }

  const Translator: TranslatorConstructor;
  const LanguageDetector: LanguageDetectorConstructor;
}

export {};
```

---

## 9. Estado de Estandarización

| API               | Estado      | W3C           | Mozilla       | WebKit        |
| ----------------- | ----------- | ------------- | ------------- | ------------- |
| Translator API    | Chrome 138+ | En progreso   | Bajo revisión | Bajo revisión |
| Language Detector | Chrome 138+ | En progreso   | Bajo revisión | Bajo revisión |
| WebGPU            | Estable     | Recomendación | Soportado     | Parcial       |

---

## 10. Recursos Adicionales

- [Chrome Translator API Docs](https://developer.chrome.com/docs/ai/translator-api)
- [Chrome Language Detector API](https://developer.chrome.com/docs/ai/language-detection)
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Opus-MT Models](https://huggingface.co/Helsinki-NLP/opus-mt-en-es)
- [NLLB-200 Models](https://huggingface.co/facebook/nllb-200-distilled-600M)
- [WebLLM Project](https://webllm.mlc.ai/)

---

## 11. Conclusión

Para el RSS Reader, la implementación recomendada es:

1. **Principal**: Chrome Translator API (Chrome 138+)

   - Mejor rendimiento
   - Sin descarga adicional visible
   - Máxima calidad

2. **Fallback**: Transformers.js con `Xenova/opus-mt-en-es` (~75MB)

   - Compatibilidad cross-browser
   - Buena calidad
   - Tamaño razonable

3. **Detección de idioma**: Chrome Language Detector API con fallback heurístico

4. **Caché**: IndexedDB para evitar re-traducciones

Esta arquitectura híbrida proporciona:

- ✅ Mejor experiencia para usuarios Chrome
- ✅ Compatibilidad con todos los navegadores modernos
- ✅ Funcionalidad offline (una vez cacheados los modelos)
- ✅ Máxima privacidad (todo on-device)
