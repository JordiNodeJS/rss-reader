/**
 * Summarization Web Worker
 *
 * Runs Transformers.js summarization off the main thread for better performance.
 * Uses BART/DistilBART models for high-quality summarization.
 *
 * IMPORTANT: This file should ONLY be loaded as a Web Worker.
 * Do not import this file directly - use summarization-transformers.ts instead.
 *
 * UPDATED: Diciembre 2025
 * - Vuelve a usar modelos BART (estables para summarization)
 * - mT5 base genera tokens <extra_id_X> porque no está fine-tuned
 * - La traducción a español se hace con Chrome Translator API
 *
 * @see https://huggingface.co/docs/transformers.js
 */

import { pipeline, env } from "@huggingface/transformers";
import {
  SUMMARIZATION_MODELS,
  DEFAULT_MODEL,
  type SummarizationModelKey,
  type WorkerRequest,
  type WorkerResponse,
  type WorkerProgressData,
  type SummarizationResult,
  type ModelStatus,
} from "./summarization-models";

// Skip local model check - always fetch from Hugging Face Hub
env.allowLocalModels = false;

// ============================================
// Pipeline Singleton
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SummarizationPipelineType = any;

class SummarizationPipelineSingleton {
  static task: "summarization" = "summarization";
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
      this.instance = await pipeline(this.task, modelConfig.id, {
        dtype: "q8", // Use quantized model for smaller size
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

        // Run summarization with BART/DistilBART models
        const result = await summarizer(data.text, {
          max_length: data.maxLength || 150,
          min_length: data.minLength || 30,
          do_sample: false,
          repetition_penalty: 1.2,
          no_repeat_ngram_size: 3,
          num_beams: 4,
          early_stopping: true,
        });

        // Result is an array, get first item
        const summaryResult = Array.isArray(result) ? result[0] : result;

        const normalizedResult: SummarizationResult = {
          summary_text: summaryResult.summary_text || "",
        };

        sendResult(normalizedResult);
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
