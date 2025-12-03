/**
 * Summarization Model Configuration
 *
 * Shared types and constants for summarization functionality.
 * This file is safe to import from both server and client contexts.
 *
 * UPDATED: Diciembre 2025
 * - Modelos cambiados a multilingües para mejor soporte de español
 * - mT5 y mBART soportan español nativamente sin necesidad de traducción
 *
 * @see docs/summarization-improvements-dec-2025.md
 */

// ============================================
// Types
// ============================================

export type WorkerMessageType =
  | "summarize"
  | "load-model"
  | "unload-model"
  | "get-status";

export interface WorkerRequest {
  id: string;
  type: WorkerMessageType;
  data?: {
    text?: string;
    modelId?: string;
    maxLength?: number;
    minLength?: number;
    targetLanguage?: string; // For multilingual models
  };
}

export interface WorkerProgressData {
  status: "initiate" | "download" | "progress" | "done" | "ready";
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
  name?: string;
}

export interface WorkerResponse {
  id: string;
  type: "progress" | "result" | "error" | "status";
  data?: WorkerProgressData | SummarizationResult | ModelStatus;
  error?: string;
}

export interface SummarizationResult {
  summary_text: string;
}

export interface ModelStatus {
  isLoaded: boolean;
  modelId: string | null;
  isLoading: boolean;
}

// ============================================
// Available Models (ordered by size/speed)
// ============================================

/**
 * Modelos multilingües para summarization
 *
 * NOTA: Los modelos mT5 y mBART requieren más recursos pero
 * producen resúmenes directamente en español sin traducción.
 *
 * Para comparación:
 * - DistilBART (anterior): Solo inglés, requiere traducción posterior
 * - mT5/mBART: Multilingüe, español nativo
 */
export const SUMMARIZATION_MODELS = {
  // DistilBART - Modelo rápido y estable para summarization
  // Genera en inglés, luego se traduce con Chrome Translator API
  "distilbart-cnn-6-6": {
    id: "Xenova/distilbart-cnn-6-6",
    name: "DistilBART CNN 6-6 (Rápido)",
    size: "~90MB",
    description: "Modelo compacto y rápido - Resumen en inglés + traducción",
    maxInputLength: 1024,
    languages: ["en"],
    supportsSpanish: false, // Requiere traducción posterior
    pipelineTask: "summarization",
  },
  // DistilBART 12-6 - Mejor calidad
  "distilbart-cnn-12-6": {
    id: "Xenova/distilbart-cnn-12-6",
    name: "DistilBART CNN 12-6 (Calidad)",
    size: "~125MB",
    description: "Mejor calidad de resumen - Resumen en inglés + traducción",
    maxInputLength: 1024,
    languages: ["en"],
    supportsSpanish: false, // Requiere traducción posterior
    pipelineTask: "summarization",
  },
  // BART Large CNN - Máxima calidad (más lento)
  "bart-large-cnn": {
    id: "Xenova/bart-large-cnn",
    name: "BART Large CNN (Premium)",
    size: "~500MB",
    description: "Máxima calidad de resumen - Para textos importantes",
    maxInputLength: 1024,
    languages: ["en"],
    supportsSpanish: false, // Requiere traducción posterior
    pipelineTask: "summarization",
  },
} as const;

export type SummarizationModelKey = keyof typeof SUMMARIZATION_MODELS;

// Default: DistilBART 6-6 por ser rápido y estable
export const DEFAULT_MODEL: SummarizationModelKey = "distilbart-cnn-6-6";

// Modelo recomendado para mejor calidad
export const RECOMMENDED_MODEL: SummarizationModelKey = "distilbart-cnn-12-6";
