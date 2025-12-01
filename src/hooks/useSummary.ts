/**
 * useSummary Hook
 *
 * React hook for generating AI summaries of article content.
 *
 * Providers disponibles (en orden de preferencia):
 * 1. "chrome" - Chrome Summarizer API (Gemini Nano) - Requiere Chrome 138+, ~22GB disco
 * 2. "proxy" - API Proxy Gemini gratuita - 5 solicitudes/hora por IP
 * 3. "gemini" - Gemini API con key del usuario - Sin límites
 * 4. "local" - Transformers.js con modelos BART + traducción a español
 *
 * UPDATED: Diciembre 2025
 * - Modelos locales: BART/DistilBART (estables para summarization)
 * - mT5 base removido (genera tokens <extra_id_X> porque no está fine-tuned)
 * - Traducción automática a español con Chrome Translator API
 *
 * @see docs/summarization-improvements-dec-2025.md
 */

"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { Article, updateArticleSummary, getArticleById } from "@/lib/db";
import {
  extractTextForSummary,
  SummarizationStatus,
  SummaryType,
  SummaryLength,
  // Chrome Summarizer API
  isSummarizerAvailable,
  getSummarizerAvailability,
  summarizeText,
  // Transformers.js exports
  summarizeWithTransformers,
  isTransformersSummarizationAvailable,
  TransformersSummarizationProgress,
  SUMMARIZATION_MODELS,
  SummarizationModelKey,
} from "@/lib/summarization";
import { translateToSpanish, detectLanguage } from "@/lib/translation";
import {
  summarizeWithGemini,
  isGeminiAvailable,
  getStoredApiKey,
  type GeminiSummarizationProgress,
} from "@/lib/summarization-gemini";

// ============================================
// Types
// ============================================

export type SummarizationBackend =
  | "chrome"
  | "proxy"
  | "gemini"
  | "transformers";
export type SummarizationProvider = "chrome" | "proxy" | "gemini" | "local";

export interface UseSummaryOptions {
  /** Article to summarize */
  article: Article | null;
  /** Summary type (default: tldr) - Kept for API compatibility */
  type?: SummaryType;
  /** Summary length (default: medium) - Controls Transformers.js output length */
  length?: SummaryLength;
  /** Cache summaries in IndexedDB */
  cacheSummaries?: boolean;
  /**
   * Provider to use:
   * - 'chrome': Chrome Summarizer API (Gemini Nano) - Requiere Chrome 138+
   * - 'proxy': API Proxy gratuita (5 req/hora)
   * - 'gemini': Google Gemini API con key del usuario
   * - 'local': Transformers.js local con modelos multilingües
   */
  provider?: SummarizationProvider;
  /** Model to use for Transformers.js (default: distilbart-cnn-6-6) */
  modelId?: SummarizationModelKey;
  /** Translate summary to Spanish after generation (default: true for BART models) */
  translateSummary?: boolean;
}

export interface UseSummaryReturn {
  /** Current summarization status */
  status: SummarizationStatus;
  /** Download/summarization progress (0-100) */
  progress: number;
  /** Status message for UI */
  message: string;
  /** Generated summary */
  summary: string;
  /** Summary type used */
  summaryType: SummaryType;
  /** Summary length used */
  summaryLength: SummaryLength;
  /** Error message if summarization failed */
  error: string | null;
  /** Availability error (kept for API compatibility) */
  availabilityError: string | null;
  /** Whether Chrome Summarizer (Gemini Nano) is available */
  isChromeSummarizerAvailable: boolean;
  /** Chrome Summarizer availability details */
  chromeSummarizerStatus:
    | "available"
    | "downloadable"
    | "downloading"
    | "unavailable"
    | "not-supported"
    | "insufficient-space";
  /** Whether Gemini API is available (has valid key stored) */
  isGeminiAvailable: boolean;
  /** Whether Transformers.js is available */
  isTransformersAvailable: boolean;
  /** Current active backend */
  activeBackend: SummarizationBackend | null;
  /** Whether summarization can be triggered */
  canSummarize: boolean;
  /** Whether cached summary exists */
  hasCachedSummary: boolean;
  /** Available summarization models */
  availableModels: typeof SUMMARIZATION_MODELS;
  /** Rate limit info for proxy provider */
  proxyRateLimit: { remaining: number; resetAt: number } | null;
  /** Generate summary */
  summarize: (
    type?: SummaryType,
    length?: SummaryLength,
    forceRegenerate?: boolean
  ) => Promise<void>;
  /** Generate summary using Transformers.js specifically */
  summarizeWithModel: (modelId?: SummarizationModelKey) => Promise<void>;
  /** Clear cached summary */
  clearSummary: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useSummary(options: UseSummaryOptions): UseSummaryReturn {
  const {
    article,
    type: defaultType = "tldr",
    length: defaultLength = "medium",
    cacheSummaries = true,
    provider = "local",
    modelId = "distilbart-cnn-6-6",
    translateSummary = true, // BART genera en inglés, traducimos a español
  } = options;

  // State
  const [status, setStatus] = useState<SummarizationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryType, setSummaryType] = useState<SummaryType>(defaultType);
  const [summaryLength, setSummaryLength] =
    useState<SummaryLength>(defaultLength);
  const [error, setError] = useState<string | null>(null);
  const [isTransformersAvailable, setIsTransformersAvailable] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [chromeSummarizerAvailable, setChromeSummarizerAvailable] =
    useState(false);
  const [chromeSummarizerStatus, setChromeSummarizerStatus] = useState<
    | "available"
    | "downloadable"
    | "downloading"
    | "unavailable"
    | "not-supported"
    | "insufficient-space"
  >("not-supported");
  const [hasCachedSummary, setHasCachedSummary] = useState(false);
  const [activeBackend, setActiveBackend] =
    useState<SummarizationBackend | null>(null);
  const [proxyRateLimit, setProxyRateLimit] = useState<{
    remaining: number;
    resetAt: number;
  } | null>(null);

  // Derived state - can summarize if any provider is available
  const canSummarize =
    !!article &&
    (isTransformersAvailable ||
      geminiAvailable ||
      chromeSummarizerAvailable ||
      true) && // proxy siempre disponible
    status !== "summarizing" &&
    status !== "downloading";

  // Check availability on mount
  useEffect(() => {
    setIsTransformersAvailable(isTransformersSummarizationAvailable());
    setGeminiAvailable(isGeminiAvailable());

    // Check Chrome Summarizer availability
    const checkChromeSummarizer = async () => {
      try {
        const available = await isSummarizerAvailable();
        setChromeSummarizerAvailable(available);

        const details = await getSummarizerAvailability();
        if (
          details.status === "available" ||
          details.status === "downloadable"
        ) {
          setChromeSummarizerStatus(details.status);
        } else {
          setChromeSummarizerStatus(
            details.status as typeof chromeSummarizerStatus
          );
        }
      } catch {
        setChromeSummarizerAvailable(false);
        setChromeSummarizerStatus("not-supported");
      }
    };

    checkChromeSummarizer();
  }, []);

  // Load cached summary when article changes
  useEffect(() => {
    if (!article) {
      setStatus("idle");
      setSummary("");
      setHasCachedSummary(false);
      setError(null);
      return;
    }

    // Check for cached summary
    if (article.summary && article.summaryType && article.summaryLength) {
      setSummary(article.summary);
      setSummaryType(article.summaryType);
      setSummaryLength(article.summaryLength);
      setHasCachedSummary(true);
      setStatus("completed");
    } else {
      setHasCachedSummary(false);
      setSummary("");
      setStatus("idle");
    }
  }, [article]);

  // Progress callback for Transformers.js
  const handleTransformersProgress = useCallback(
    (progressData: TransformersSummarizationProgress) => {
      // Map Transformers.js status to our status type
      const statusMap: Record<string, SummarizationStatus> = {
        idle: "idle",
        "loading-model": "downloading",
        downloading: "downloading",
        summarizing: "summarizing",
        completed: "completed",
        error: "error",
      };
      setStatus(statusMap[progressData.status] || "checking");
      setProgress(progressData.progress);
      setMessage(progressData.message);
    },
    []
  );

  // Progress callback for Gemini
  const handleGeminiProgress = useCallback(
    (progressData: GeminiSummarizationProgress) => {
      const statusMap: Record<string, SummarizationStatus> = {
        idle: "idle",
        summarizing: "summarizing",
        completed: "completed",
        error: "error",
      };
      setStatus(statusMap[progressData.status] || "summarizing");
      setProgress(progressData.progress);
      setMessage(progressData.message);
    },
    []
  );

  // Summarize function - uses provider based on selection
  const summarize = useCallback(
    async (
      type?: SummaryType,
      length?: SummaryLength,
      forceRegenerate?: boolean
    ) => {
      if (!article) return;

      // Skip if already summarized and not forcing regeneration
      if (!forceRegenerate && hasCachedSummary && summary) {
        return;
      }

      const useType = type || defaultType;
      const useLength = length || defaultLength;

      setError(null);
      setSummaryType(useType);
      setSummaryLength(useLength);

      // Get content to summarize
      const contentToSummarize =
        article.scrapedContent ||
        article.content ||
        article.contentSnippet ||
        "";

      // Extract plain text (remove HTML)
      const textContent = extractTextForSummary(contentToSummarize);

      if (!textContent || textContent.length < 50) {
        setError("El contenido del artículo es demasiado corto para resumir");
        setStatus("error");
        return;
      }

      // ============================================
      // Provider: Chrome Summarizer API (Gemini Nano)
      // ============================================
      if (provider === "chrome" && chromeSummarizerAvailable) {
        try {
          setActiveBackend("chrome");
          setStatus("checking");
          setMessage("Verificando Chrome Summarizer API...");

          const result = await summarizeText({
            text: textContent,
            type: useType,
            length: useLength,
            outputLanguage: "es", // Spanish output
            onProgress: (p) => {
              setStatus(p.status);
              setProgress(p.progress);
              setMessage(p.message);
            },
          });

          setSummary(result.summary);
          setStatus("completed");
          setMessage("Resumen generado con Chrome Summarizer (Gemini Nano)");
          setHasCachedSummary(true);

          // Cache in IndexedDB
          if (cacheSummaries && article.id) {
            try {
              await updateArticleSummary(
                article.id,
                result.summary,
                useType,
                useLength
              );
            } catch (cacheError) {
              console.warn("[useSummary] Failed to cache summary:", cacheError);
            }
          }
          return;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error con Chrome Summarizer";
          console.warn("[useSummary] Chrome Summarizer failed:", errorMessage);
          // Fall through to next provider
        }
      }

      // ============================================
      // Provider: API Proxy (Gemini gratuito con rate limit)
      // ============================================
      if (provider === "proxy") {
        try {
          setActiveBackend("proxy");
          setStatus("summarizing");
          setMessage("Conectando con API de resumen...");
          setProgress(10);

          const response = await fetch("/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: textContent,
              length: useLength,
            }),
          });

          // Update rate limit info from headers
          const remaining = response.headers.get("X-RateLimit-Remaining");
          const resetAt = response.headers.get("X-RateLimit-Reset");
          if (remaining && resetAt) {
            setProxyRateLimit({
              remaining: parseInt(remaining, 10),
              resetAt: parseInt(resetAt, 10),
            });
          }

          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 429) {
              throw new Error(
                errorData.message || "Límite de solicitudes alcanzado"
              );
            }
            throw new Error(
              errorData.error || "Error en el servicio de resumen"
            );
          }

          const result = await response.json();

          setProgress(100);
          setSummary(result.summary);
          setStatus("completed");
          setMessage("Resumen generado con API gratuita");
          setHasCachedSummary(true);

          // Cache in IndexedDB
          if (cacheSummaries && article.id) {
            try {
              await updateArticleSummary(
                article.id,
                result.summary,
                useType,
                useLength
              );
            } catch (cacheError) {
              console.warn("[useSummary] Failed to cache summary:", cacheError);
            }
          }
          return;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error con API proxy";
          setError(errorMessage);
          setStatus("error");
          setMessage(errorMessage);
          return;
        }
      }

      // ============================================
      // Provider: Gemini API (con key del usuario)
      // ============================================
      if (provider === "gemini" && isGeminiAvailable()) {
        try {
          setActiveBackend("gemini");
          const apiKey = getStoredApiKey();
          if (!apiKey) {
            throw new Error("No hay API key de Gemini configurada");
          }

          const result = await summarizeWithGemini({
            text: textContent,
            apiKey,
            length: useLength,
            outputLanguage: "es", // Always Spanish
            onProgress: handleGeminiProgress,
          });

          setSummary(result.summary);
          setStatus("completed");
          setMessage("Resumen generado con Gemini");
          setHasCachedSummary(true);

          // Cache in IndexedDB
          if (cacheSummaries && article.id) {
            try {
              await updateArticleSummary(
                article.id,
                result.summary,
                useType,
                useLength
              );
            } catch (cacheError) {
              console.warn("[useSummary] Failed to cache summary:", cacheError);
            }
          }
          return;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error con Gemini API";
          setError(errorMessage);
          setStatus("error");
          setMessage(errorMessage);
          return;
        }
      }

      // ============================================
      // Provider: Transformers.js Local (mT5 multilingüe)
      // ============================================
      if (!isTransformersAvailable) {
        setError("Transformers.js no está disponible en este navegador");
        setStatus("error");
        return;
      }

      try {
        setActiveBackend("transformers");

        // Check if model supports Spanish natively
        const modelConfig = SUMMARIZATION_MODELS[modelId];
        const supportsSpanish = modelConfig?.supportsSpanish ?? false;

        // Only translate if model doesn't support Spanish and translation is requested
        let needsTranslation = translateSummary && !supportsSpanish;

        if (!supportsSpanish) {
          try {
            const detection = await detectLanguage(textContent);
            needsTranslation = translateSummary || !detection.isSpanish;
          } catch {
            // If language detection fails, assume translation is needed for non-Spanish models
            needsTranslation = true;
          }
        }

        // Calculate maxLength and minLength based on summary length
        const lengthConfig = {
          short: { maxLength: 75, minLength: 20 },
          medium: { maxLength: 150, minLength: 40 },
          long: { maxLength: 250, minLength: 80 },
          extended: { maxLength: 500, minLength: 150 },
        };
        const { maxLength, minLength } = lengthConfig[useLength];

        // Use larger model for extended summaries
        const useModelId: SummarizationModelKey =
          useLength === "extended" ? "bart-large-cnn" : modelId;

        const result = await summarizeWithTransformers({
          text: textContent,
          modelId: useModelId,
          maxLength,
          minLength,
          onProgress: handleTransformersProgress,
        });
        let resultSummary = result.summary;
        let translationFailed = false;

        // Only translate if using non-Spanish model (like DistilBART)
        if (needsTranslation && resultSummary) {
          setStatus("summarizing");
          setMessage("Traduciendo resumen al español...");
          try {
            const translationResult = await translateToSpanish({
              text: resultSummary,
              skipLanguageDetection: true,
              sourceLanguage: "en",
            });
            resultSummary = translationResult.translatedText;
          } catch (translateError) {
            console.warn(
              "[useSummary] Failed to translate summary:",
              translateError
            );
            translationFailed = true;
            resultSummary = `[Resumen en inglés - traducción no disponible]\n\n${resultSummary}`;
          }
        }

        setSummary(resultSummary);
        setStatus("completed");
        setMessage(
          supportsSpanish
            ? "Resumen generado en español"
            : translationFailed
            ? "Resumen generado (sin traducir)"
            : "Resumen generado"
        );
        setHasCachedSummary(true);

        // Cache in IndexedDB
        if (cacheSummaries && article.id) {
          try {
            await updateArticleSummary(
              article.id,
              resultSummary,
              useType,
              useLength
            );
          } catch (cacheError) {
            console.warn("[useSummary] Failed to cache summary:", cacheError);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al generar el resumen";
        setError(errorMessage);
        setStatus("error");
        setMessage(errorMessage);
      }
    },
    [
      article,
      hasCachedSummary,
      summary,
      cacheSummaries,
      handleTransformersProgress,
      handleGeminiProgress,
      defaultType,
      defaultLength,
      isTransformersAvailable,
      modelId,
      translateSummary,
      provider,
      chromeSummarizerAvailable,
    ]
  );

  // Summarize with specific Transformers.js model
  const summarizeWithModel = useCallback(
    async (specificModelId?: SummarizationModelKey) => {
      if (!article || !isTransformersAvailable) return;

      const useModelId = specificModelId || modelId;

      setError(null);
      setActiveBackend("transformers");

      try {
        const contentToSummarize =
          article.scrapedContent ||
          article.content ||
          article.contentSnippet ||
          "";

        const textContent = extractTextForSummary(contentToSummarize);

        if (!textContent || textContent.length < 50) {
          throw new Error(
            "El contenido del artículo es demasiado corto para resumir"
          );
        }

        const result = await summarizeWithTransformers({
          text: textContent,
          modelId: useModelId,
          maxLength: 150,
          minLength: 40,
          onProgress: handleTransformersProgress,
        });

        setSummary(result.summary);
        setStatus("completed");
        setMessage("Resumen generado con Transformers.js");
        setHasCachedSummary(true);

        // Cache in IndexedDB
        if (cacheSummaries && article.id) {
          try {
            await updateArticleSummary(
              article.id,
              result.summary,
              "tldr",
              "medium"
            );
          } catch (cacheError) {
            console.warn("[useSummary] Failed to cache summary:", cacheError);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al generar el resumen";
        setError(errorMessage);
        setStatus("error");
        setMessage(errorMessage);
      }
    },
    [
      article,
      isTransformersAvailable,
      cacheSummaries,
      handleTransformersProgress,
      modelId,
    ]
  );

  // Clear cached summary
  const clearSummary = useCallback(async () => {
    setSummary("");
    setHasCachedSummary(false);
    setStatus("idle");
    setError(null);

    // Clear from IndexedDB
    if (article?.id && cacheSummaries) {
      try {
        const currentArticle = await getArticleById(article.id);
        if (currentArticle) {
          await updateArticleSummary(article.id, "", "tldr", "medium");
        }
      } catch (err) {
        console.warn("[useSummary] Failed to clear cached summary:", err);
      }
    }
  }, [article?.id, cacheSummaries]);

  return {
    status,
    progress,
    message,
    summary,
    summaryType,
    summaryLength,
    error,
    availabilityError: null,
    isChromeSummarizerAvailable: chromeSummarizerAvailable,
    chromeSummarizerStatus,
    isGeminiAvailable: geminiAvailable,
    isTransformersAvailable,
    activeBackend,
    canSummarize,
    hasCachedSummary,
    availableModels: SUMMARIZATION_MODELS,
    proxyRateLimit,
    summarize,
    summarizeWithModel,
    clearSummary,
  };
}

// ============================================
// Utility Hook: Check Availability (simplified)
// ============================================

// Use useSyncExternalStore pattern to avoid cascading renders
const emptySubscribe = () => () => {};
const getAvailabilitySnapshot = () => isTransformersSummarizationAvailable();
const getServerAvailabilitySnapshot = () => false;

export function useSummarizerAvailability() {
  const isAvailable = useSyncExternalStore(
    emptySubscribe,
    getAvailabilitySnapshot,
    getServerAvailabilitySnapshot
  );

  return { isAvailable, loading: false };
}
