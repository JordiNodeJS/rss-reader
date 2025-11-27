/**
 * Transformers.js Summarization Service
 *
 * Provides article summarization using Transformers.js with smaller models
 * that run entirely in the browser. Falls back from Chrome's Summarizer API
 * when it's not available or when user prefers smaller models.
 *
 * @see https://huggingface.co/docs/transformers.js
 */

import type {
  SummarizationModelKey,
  WorkerRequest,
  WorkerResponse,
  WorkerProgressData,
  SummarizationResult,
  ModelStatus,
} from "./summarization-models";

// Re-export model configuration
export { SUMMARIZATION_MODELS, DEFAULT_MODEL } from "./summarization-models";
export type { SummarizationModelKey } from "./summarization-models";

// ============================================
// Types
// ============================================

export type TransformersSummarizationStatus =
  | "idle"
  | "loading-model"
  | "downloading"
  | "summarizing"
  | "completed"
  | "error";

export interface TransformersSummarizationProgress {
  status: TransformersSummarizationStatus;
  progress: number;
  message: string;
  file?: string;
}

export interface TransformersSummarizationOptions {
  text: string;
  modelId?: SummarizationModelKey;
  maxLength?: number;
  minLength?: number;
  onProgress?: (progress: TransformersSummarizationProgress) => void;
}

export interface TransformersSummarizationResult {
  summary: string;
  modelId: string;
  timestamp: number;
}

// ============================================
// Worker Manager Singleton
// ============================================

let workerInstance: Worker | null = null;
const pendingRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: TransformersSummarizationProgress) => void;
  }
>();

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getWorker(): Worker {
  if (!workerInstance) {
    if (typeof window === "undefined") {
      throw new Error("Transformers.js summarization only works in browser");
    }

    workerInstance = new Worker(
      new URL("./summarization-worker.ts", import.meta.url),
      { type: "module" }
    );

    workerInstance.addEventListener("message", handleWorkerMessage);
    workerInstance.addEventListener("error", (error) => {
      console.error("[TransformersSummarization] Worker error:", error);
    });
  }
  return workerInstance;
}

function handleWorkerMessage(
  event: MessageEvent<WorkerResponse | { type: "ready" }>
) {
  const message = event.data;

  // Handle worker ready signal
  if (message.type === "ready" && !("id" in message)) {
    console.log("[TransformersSummarization] Worker ready");
    return;
  }

  const response = message as WorkerResponse;
  const pending = pendingRequests.get(response.id);

  if (!pending) {
    console.warn(
      "[TransformersSummarization] Received response for unknown request:",
      response.id
    );
    return;
  }

  switch (response.type) {
    case "progress": {
      const progressData = response.data as WorkerProgressData;
      const progress = mapWorkerProgress(progressData);
      pending.onProgress?.(progress);
      break;
    }

    case "result": {
      pendingRequests.delete(response.id);
      pending.resolve(response.data);
      break;
    }

    case "status": {
      pendingRequests.delete(response.id);
      pending.resolve(response.data);
      break;
    }

    case "error": {
      pendingRequests.delete(response.id);
      pending.reject(new Error(response.error || "Unknown error"));
      break;
    }
  }
}

function mapWorkerProgress(
  data: WorkerProgressData
): TransformersSummarizationProgress {
  switch (data.status) {
    case "initiate":
      return {
        status: "downloading",
        progress: 0,
        message: `Iniciando descarga de ${data.file || "modelo"}...`,
        file: data.file,
      };
    case "download":
    case "progress":
      const progress =
        data.progress ??
        (data.loaded && data.total ? (data.loaded / data.total) * 100 : 0);
      return {
        status: "downloading",
        progress: Math.round(progress),
        message: `Descargando ${data.file || "modelo"}: ${Math.round(
          progress
        )}%`,
        file: data.file,
      };
    case "done":
      return {
        status: "loading-model",
        progress: 100,
        message: `${data.file || "Archivo"} descargado`,
        file: data.file,
      };
    case "ready":
      return {
        status: "summarizing",
        progress: 0,
        message: "Generando resumen...",
      };
    default:
      return {
        status: "loading-model",
        progress: 0,
        message: "Procesando...",
      };
  }
}

async function sendWorkerRequest<T>(
  request: WorkerRequest,
  onProgress?: (progress: TransformersSummarizationProgress) => void
): Promise<T> {
  const worker = getWorker();

  return new Promise((resolve, reject) => {
    pendingRequests.set(request.id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      onProgress,
    });

    worker.postMessage(request);

    // Timeout after 5 minutes (model download can take a while)
    setTimeout(() => {
      if (pendingRequests.has(request.id)) {
        pendingRequests.delete(request.id);
        reject(new Error("Summarization request timed out"));
      }
    }, 5 * 60 * 1000);
  });
}

// ============================================
// Public API
// ============================================

/**
 * Check if Transformers.js summarization is available
 */
export function isTransformersSummarizationAvailable(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

/**
 * Summarize text using Transformers.js
 */
export async function summarizeWithTransformers(
  options: TransformersSummarizationOptions
): Promise<TransformersSummarizationResult> {
  const {
    text,
    modelId,
    maxLength = 150,
    minLength = 30,
    onProgress,
  } = options;

  if (!text || text.trim().length === 0) {
    throw new Error("No se proporcionó texto para resumir");
  }

  if (!isTransformersSummarizationAvailable()) {
    throw new Error("Transformers.js no está disponible en este entorno");
  }

  onProgress?.({
    status: "loading-model",
    progress: 0,
    message: "Cargando modelo de resumen...",
  });

  const request: WorkerRequest = {
    id: generateRequestId(),
    type: "summarize",
    data: {
      text,
      modelId,
      maxLength,
      minLength,
    },
  };

  const result = await sendWorkerRequest<SummarizationResult>(
    request,
    onProgress
  );

  onProgress?.({
    status: "completed",
    progress: 100,
    message: "Resumen generado",
  });

  return {
    summary: result.summary_text,
    modelId: modelId || "distilbart-cnn-6-6",
    timestamp: Date.now(),
  };
}

/**
 * Pre-load a summarization model
 */
export async function preloadSummarizationModel(
  modelId: SummarizationModelKey = "distilbart-cnn-6-6",
  onProgress?: (progress: TransformersSummarizationProgress) => void
): Promise<void> {
  if (!isTransformersSummarizationAvailable()) {
    throw new Error("Transformers.js no está disponible en este entorno");
  }

  const request: WorkerRequest = {
    id: generateRequestId(),
    type: "load-model",
    data: { modelId },
  };

  await sendWorkerRequest<ModelStatus>(request, onProgress);
}

/**
 * Unload the current summarization model
 */
export async function unloadSummarizationModel(): Promise<void> {
  if (!workerInstance) return;

  const request: WorkerRequest = {
    id: generateRequestId(),
    type: "unload-model",
  };

  await sendWorkerRequest<ModelStatus>(request);
}

/**
 * Get the current model status
 */
export async function getSummarizationModelStatus(): Promise<ModelStatus> {
  if (!isTransformersSummarizationAvailable() || !workerInstance) {
    return {
      isLoaded: false,
      modelId: null,
      isLoading: false,
    };
  }

  const request: WorkerRequest = {
    id: generateRequestId(),
    type: "get-status",
  };

  return sendWorkerRequest<ModelStatus>(request);
}

/**
 * Terminate the worker (clean up resources)
 */
export function terminateSummarizationWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    pendingRequests.clear();
  }
}

// ============================================
// Cache Management
// ============================================

const TRANSFORMERS_CACHE_NAME = "transformers-cache";

/**
 * Get information about cached summarization models
 */
export async function getCachedSummarizationModels(): Promise<
  Array<{
    name: string;
    size: number;
    url: string;
  }>
> {
  if (typeof caches === "undefined") return [];

  try {
    const cache = await caches.open(TRANSFORMERS_CACHE_NAME);
    const keys = await cache.keys();

    const models: Array<{ name: string; size: number; url: string }> = [];

    for (const request of keys) {
      // Filter for summarization model files
      if (
        request.url.includes("distilbart") ||
        request.url.includes("bart-large") ||
        request.url.includes("summarization")
      ) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const urlParts = request.url.split("/");
          models.push({
            name: urlParts[urlParts.length - 1] || request.url,
            size: blob.size,
            url: request.url,
          });
        }
      }
    }

    return models;
  } catch (error) {
    console.error(
      "[TransformersSummarization] Error getting cached models:",
      error
    );
    return [];
  }
}

/**
 * Clear cached summarization models
 */
export async function clearSummarizationModelCache(): Promise<void> {
  if (typeof caches === "undefined") return;

  try {
    const cache = await caches.open(TRANSFORMERS_CACHE_NAME);
    const keys = await cache.keys();

    for (const request of keys) {
      if (
        request.url.includes("distilbart") ||
        request.url.includes("bart-large") ||
        request.url.includes("summarization")
      ) {
        await cache.delete(request);
      }
    }

    // Also terminate the worker to release memory
    terminateSummarizationWorker();

    console.log("[TransformersSummarization] Cache cleared");
  } catch (error) {
    console.error("[TransformersSummarization] Error clearing cache:", error);
    throw error;
  }
}

/**
 * Get total size of cached summarization models
 */
export async function getSummarizationCacheSize(): Promise<number> {
  const models = await getCachedSummarizationModels();
  return models.reduce((total, model) => total + model.size, 0);
}
