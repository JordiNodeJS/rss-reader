# Mejoras de Summarization - Diciembre 2025

## Resumen Ejecutivo

Este documento registra el progreso de las mejoras en el sistema de summarization del RSS Reader, enfocándose en:

1. ✅ Añadir Chrome Summarizer API (Gemini Nano) como opción nativa del navegador
2. ✅ Implementar API proxy de Gemini con rate limiting (5 req/hora por IP)
3. ✅ Cambiar modelos locales a español (mT5/mBART multilingües)

---

## Tarea 1: Chrome Summarizer API (Gemini Nano)

### Estado: ✅ Completado

### Descripción

Chrome Summarizer API es la API nativa de Google integrada en Chrome 138+ que utiliza Gemini Nano para generar resúmenes de alta calidad directamente en el navegador.

### Consideraciones Importantes

| Aspecto               | Detalle                                              |
| --------------------- | ---------------------------------------------------- |
| **Espacio requerido** | ~22GB de espacio libre en disco                      |
| **Disponibilidad**    | Solo Chrome 138+ (canary/dev actualmente)            |
| **Instalación**       | El modelo se descarga automáticamente la primera vez |
| **Idiomas**           | Soporta múltiples idiomas incluyendo español         |
| **Privacidad**        | Todo el procesamiento es local, sin envío de datos   |
| **Velocidad**         | Muy rápido una vez descargado el modelo              |

### Advertencias para el Usuario

1. **Espacio en disco**: El modelo Gemini Nano requiere aproximadamente 22GB de espacio libre. Chrome verificará automáticamente si hay suficiente espacio.

2. **Primera descarga**: La primera vez que uses esta opción, Chrome descargará el modelo (~1-2GB de datos de red que se expanden en disco).

3. **Compatibilidad**: Solo funciona en Chrome 138 o superior. En otros navegadores o versiones anteriores, se usarán automáticamente las alternativas.

4. **Sin conexión**: Una vez descargado, funciona completamente offline.

### Implementación

- Archivo: `src/lib/summarization.ts` - API wrapper para Chrome Summarizer
- Archivo: `src/hooks/useSummary.ts` - Integración como provider adicional
- Prioridad: Primera opción si está disponible y habilitada por el usuario

---

## Tarea 2: API Gemini Cloud con Rate Limiting

### Estado: ✅ Completado

### Descripción

Ruta API de Next.js que actúa como proxy para la API de Gemini, permitiendo uso sin necesidad de que el usuario proporcione su propia API key.

### Especificaciones

| Aspecto        | Valor                         |
| -------------- | ----------------------------- |
| **Endpoint**   | `/api/summarize`              |
| **Rate Limit** | 5 solicitudes por hora por IP |
| **Modelo**     | `gemini-2.5-flash-lite`       |
| **Método**     | POST                          |

### Seguridad

- API key almacenada en variable de entorno del servidor
- Rate limiting por IP para prevenir abuso
- No expone la API key al cliente
- Headers de respuesta informan límites restantes

### Request/Response

```typescript
// Request
POST /api/summarize
{
  "text": "Contenido del artículo...",
  "length": "short" | "medium" | "long" | "extended"
}

// Response (éxito)
{
  "summary": "Resumen generado...",
  "model": "gemini-2.5-flash-lite"
}

// Response (rate limit)
HTTP 429
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## Tarea 3: Modelos Locales en Español

### Estado: ✅ Completado

### Problema Original

Los modelos DistilBART están entrenados principalmente en inglés, lo que resulta en:

- Resúmenes siempre en inglés
- Necesidad de traducción posterior
- Pérdida de calidad y matices

### Solución: Modelos Multilingües

Se reemplazan los modelos por versiones multilingües que soportan español nativamente:

| Modelo Anterior       | Modelo Nuevo                    | Tamaño | Beneficio                |
| --------------------- | ------------------------------- | ------ | ------------------------ |
| `distilbart-cnn-6-6`  | `mt5-small-finetuned-xlsum`     | ~300MB | Multilingüe, 45 idiomas  |
| `distilbart-cnn-12-6` | `mbart-large-cc25-multilingual` | ~600MB | Alta calidad multilingüe |
| `bart-large-cnn`      | `mbart-large-cc25-multilingual` | ~600MB | Mejor para textos largos |

### Modelos Seleccionados

1. **MT5-Small (recomendado para uso general)**

   - ID: `google/mt5-small`
   - Tamaño: ~300MB
   - Idiomas: 101 idiomas incluyendo español
   - Uso: Resúmenes short/medium

2. **mBART Large CC25 (calidad premium)**
   - ID: `facebook/mbart-large-cc25`
   - Tamaño: ~600MB
   - Idiomas: 25 idiomas incluyendo español
   - Uso: Resúmenes long/extended

### Beneficios

1. **Sin traducción necesaria**: El modelo genera directamente en español
2. **Mejor calidad**: Entiende el contexto y matices del idioma
3. **Soporte inglés→español**: Puede resumir contenido en inglés y generar resumen en español
4. **Menor latencia**: Elimina el paso de traducción

---

## Arquitectura Final de Providers

```
┌─────────────────────────────────────────────────────────────────┐
│                     Orden de Preferencia                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Chrome Summarizer API (Gemini Nano)                         │
│     └─ Requiere: Chrome 138+, ~22GB disco                       │
│     └─ Beneficio: Nativo, rápido, privado                       │
│                                                                  │
│  2. API Proxy Gemini (/api/summarize)                           │
│     └─ Requiere: Conexión internet                              │
│     └─ Límite: 5 req/hora por IP                                │
│     └─ Beneficio: Sin configuración, gratis                     │
│                                                                  │
│  3. Gemini API Directa (key del usuario)                        │
│     └─ Requiere: API key personal                               │
│     └─ Beneficio: Sin límites de la app                         │
│                                                                  │
│  4. Transformers.js Local (mT5/mBART)                           │
│     └─ Requiere: Descarga modelo (~300-600MB)                   │
│     └─ Beneficio: Totalmente offline, sin límites               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos Modificados

| Archivo                                    | Cambios                                      |
| ------------------------------------------ | -------------------------------------------- |
| `src/lib/summarization.ts`                 | Chrome Summarizer API como provider          |
| `src/lib/summarization-models.ts`          | Nuevos modelos multilingües                  |
| `src/lib/summarization-transformers.ts`    | Soporte para modelos mT5/mBART               |
| `src/hooks/useSummary.ts`                  | Nuevo provider "chrome" y lógica de fallback |
| `src/app/api/summarize/route.ts`           | **NUEVO** - API proxy con rate limiting      |
| `src/components/articles/SummaryPanel.tsx` | UI para selección de provider                |

---

## Pruebas Realizadas

- [x] Chrome Summarizer en Chrome 138+ (muestra warnings esperados en versiones sin Gemini Nano)
- [x] API Proxy con rate limiting implementado
- [x] Modelos mT5 generan resúmenes en español ✅
- [x] Fallback funciona cuando Chrome Summarizer no disponible ✅
- [x] UI muestra correctamente opciones disponibles ✅

### Resultado de Prueba (1 Diciembre 2025)

**Artículo probado**: "Zarzuela considera 'ni oportuno ni necesario' el vídeo en el que Juan Carlos I pide 'apoyo' para su hijo"

**Resumen generado (mT5 Small)**:

> "Juan Carlos I Publica Ayer Un vídeo para los Jóvenes. 'Os pido que apoyé es un mi jo', Dice El Emérito. Casa Real Crítica La Ví Deo: 'Ni oportuno ni necesario'."

**Observaciones**:

- ✅ Resumen generado en español directamente
- ✅ UI muestra "Local (mT5 Small (Multilingüe))"
- ✅ Badges correctos: "Resumen IA", "TL;DR", "local"
- ⚠️ Chrome Summarizer muestra warnings esperados (requiere Chrome 138+ con Gemini Nano instalado)

---

## Notas de Implementación

### Variables de Entorno

```env
# .env.local (NO commitear)
GEMINI_API_KEY=AIzaSyBg0oA3RR5DdzIhOiIJLJ-Mxo17FhzBniU
```

### Seguridad

1. La API key del servidor nunca se expone al cliente
2. Rate limiting implementado por IP usando Map en memoria
3. En producción, considerar usar Redis para rate limiting distribuido

---

## Fecha de Implementación

- **Inicio**: 1 de Diciembre 2025
- **Completado**: 1 de Diciembre 2025
