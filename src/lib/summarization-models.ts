/**
 * Summarization Model Configuration
 *
 * Shared types and constants for summarization functionality.
 * This file is safe to import from both server and client contexts.
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

export const SUMMARIZATION_MODELS = {
  // Smallest, fastest (~60MB) - Good for quick summaries
  "distilbart-cnn-6-6": {
    id: "Xenova/distilbart-cnn-6-6",
    name: "DistilBART CNN 6-6",
    size: "~60MB",
    description: "Fast and lightweight summarization model",
    maxInputLength: 1024,
  },
  // Medium size (~125MB) - Better quality
  "distilbart-cnn-12-6": {
    id: "Xenova/distilbart-cnn-12-6",
    name: "DistilBART CNN 12-6",
    size: "~125MB",
    description: "Balanced quality and speed",
    maxInputLength: 1024,
  },
  // Larger (~270MB) - Best quality for English
  "bart-large-cnn": {
    id: "Xenova/bart-large-cnn",
    name: "BART Large CNN",
    size: "~270MB",
    description: "High quality English summarization",
    maxInputLength: 1024,
  },
} as const;

export type SummarizationModelKey = keyof typeof SUMMARIZATION_MODELS;
export const DEFAULT_MODEL: SummarizationModelKey = "distilbart-cnn-12-6";
