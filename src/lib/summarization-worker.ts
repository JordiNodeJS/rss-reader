/**
 * Summarization Web Worker
 *
 * Runs Transformers.js summarization off the main thread for better performance.
 * Uses smaller models like distilbart-cnn-6-6 for efficient summarization.
 *
 * @see https://huggingface.co/docs/transformers.js
 */

import { pipeline, env } from "@huggingface/transformers";

// Skip local model check - always fetch from Hugging Face Hub
env.allowLocalModels = false;

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
export const DEFAULT_MODEL: SummarizationModelKey = "distilbart-cnn-6-6";

// ============================================
// Pipeline Singleton
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SummarizationPipelineType = any;

class SummarizationPipelineSingleton {
  static task = "summarization";
  static modelId: string | null = null;
  static instance: SummarizationPipelineType | null = null;
  static isLoading = false;

  static async getInstance(
    modelKey: SummarizationModelKey = DEFAULT_MODEL,
    progressCallback?: (data: WorkerProgressData) => void
  ): Promise<SummarizationPipelineType> {
    const modelConfig = SUMMARIZATION_MODELS[modelKey];

    // If model is already loaded with the same ID, return it
    if (this.instance && this.modelId === modelConfig.id) {
      return this.instance;
    }

    // If loading a different model, unload the current one first
    if (this.instance && this.modelId !== modelConfig.id) {
      await this.unload();
    }

    this.isLoading = true;
    this.modelId = modelConfig.id;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.instance = await pipeline("summarization" as any, modelConfig.id, {
        progress_callback: (data: WorkerProgressData) => {
          progressCallback?.(data);
        },
      });

      this.isLoading = false;
      return this.instance;
    } catch (error) {
      this.isLoading = false;
      this.modelId = null;
      throw error;
    }
  }

  static async unload(): Promise<void> {
    if (this.instance) {
      // Transformers.js pipelines don't have an explicit dispose method,
      // but we can clear the reference to allow garbage collection
      this.instance = null;
      this.modelId = null;
    }
  }

  static getStatus(): ModelStatus {
    return {
      isLoaded: this.instance !== null,
      modelId: this.modelId,
      isLoading: this.isLoading,
    };
  }
}

// ============================================
// Message Handler
// ============================================

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, data } = event.data;

  const sendProgress = (progressData: WorkerProgressData) => {
    self.postMessage({
      id,
      type: "progress",
      data: progressData,
    } as WorkerResponse);
  };

  const sendResult = (resultData: SummarizationResult | ModelStatus) => {
    self.postMessage({
      id,
      type: type === "get-status" ? "status" : "result",
      data: resultData,
    } as WorkerResponse);
  };

  const sendError = (error: string) => {
    self.postMessage({
      id,
      type: "error",
      error,
    } as WorkerResponse);
  };

  try {
    switch (type) {
      case "summarize": {
        if (!data?.text) {
          sendError("No text provided for summarization");
          return;
        }

        // Get model key from modelId or use default
        const modelKey =
          (data.modelId as SummarizationModelKey) || DEFAULT_MODEL;

        // Get or load the summarization pipeline
        const summarizer = await SummarizationPipelineSingleton.getInstance(
          modelKey,
          sendProgress
        );

        // Signal ready
        sendProgress({ status: "ready" });

        // Perform summarization
        const result = await summarizer(data.text, {
          max_length: data.maxLength || 150,
          min_length: data.minLength || 30,
          do_sample: false,
        });

        // Result is an array, get first item
        const summaryResult = Array.isArray(result) ? result[0] : result;
        sendResult(summaryResult as SummarizationResult);
        break;
      }

      case "load-model": {
        const modelKey =
          (data?.modelId as SummarizationModelKey) || DEFAULT_MODEL;
        await SummarizationPipelineSingleton.getInstance(
          modelKey,
          sendProgress
        );
        sendProgress({ status: "ready" });
        sendResult(SummarizationPipelineSingleton.getStatus());
        break;
      }

      case "unload-model": {
        await SummarizationPipelineSingleton.unload();
        sendResult(SummarizationPipelineSingleton.getStatus());
        break;
      }

      case "get-status": {
        sendResult(SummarizationPipelineSingleton.getStatus());
        break;
      }

      default:
        sendError(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SummarizationWorker] Error:", errorMessage);
    sendError(errorMessage);
  }
});

// Signal that worker is ready
self.postMessage({ type: "ready" });
