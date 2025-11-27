/**
 * useSummary Hook
 *
 * React hook for generating AI summaries of article content.
 * Supports two backends:
 * 1. Chrome's Summarizer API (Gemini Nano - Chrome 138+) - Primary
 * 2. Transformers.js with smaller models (DistilBART) - Fallback
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { Article, updateArticleSummary, getArticleById } from "@/lib/db";
import {
  summarizeText,
  extractTextForSummary,
  isSummarizerAvailable,
  getSummarizerAvailability,
  SummarizationStatus,
  SummarizationProgress,
  SummaryType,
  SummaryLength,
  // Transformers.js exports
  summarizeWithTransformers,
  isTransformersSummarizationAvailable,
  TransformersSummarizationProgress,
  SUMMARIZATION_MODELS,
  SummarizationModelKey,
} from "@/lib/summarization";
import { translateToSpanish } from "@/lib/translation";

// ============================================
// Types
// ============================================

export type SummarizationBackend = "chrome" | "transformers" | "auto";

export interface UseSummaryOptions {
  /** Article to summarize */
  article: Article | null;
  /** Summary type (default: tldr) - Only used with Chrome API */
  type?: SummaryType;
  /** Summary length (default: medium) - Only used with Chrome API */
  length?: SummaryLength;
  /** Cache summaries in IndexedDB */
  cacheSummaries?: boolean;
  /** Preferred backend: 'chrome', 'transformers', or 'auto' (default) */
  backend?: SummarizationBackend;
  /** Model to use for Transformers.js (default: distilbart-cnn-6-6) */
  modelId?: SummarizationModelKey;
  /** Translate summary to Spanish after generation (useful for Transformers.js which only outputs English) */
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
  /** Availability error (e.g., insufficient space) */
  availabilityError: string | null;
  /** Whether Chrome Summarizer API is available */
  isChromeAvailable: boolean;
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
    backend = "auto",
    modelId = "distilbart-cnn-6-6",
    translateSummary = false,
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
  const [isChromeAvailable, setIsChromeAvailable] = useState(false);
  const [isTransformersAvailable, setIsTransformersAvailable] = useState(false);
  const [hasCachedSummary, setHasCachedSummary] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );
  const [activeBackend, setActiveBackend] =
    useState<SummarizationBackend | null>(null);

  // Derived state - can summarize if any backend is available
  const canSummarize =
    !!article &&
    (isChromeAvailable || isTransformersAvailable) &&
    status !== "summarizing" &&
    status !== "downloading";

  // Check API availability on mount
  useEffect(() => {
    let mounted = true;

    // Check Transformers.js availability (always available in browser)
    setIsTransformersAvailable(isTransformersSummarizationAvailable());

    // Check Chrome Summarizer API availability
    isSummarizerAvailable()
      .then((available) => {
        if (mounted) {
          setIsChromeAvailable(available);
          if (!available) {
            // Get detailed availability info to check for specific errors
            getSummarizerAvailability()
              .then((result) => {
                if (
                  mounted &&
                  result.status === "insufficient-space" &&
                  result.error
                ) {
                  setAvailabilityError(result.error);
                  console.warn(
                    "[useSummary] Insufficient disk space detected:",
                    result.error
                  );
                } else if (mounted && result.error) {
                  setAvailabilityError(result.error);
                }
              })
              .catch(() => {
                // Ignore errors in detailed check
              });
            console.log(
              "[useSummary] Chrome Summarizer API not available, Transformers.js fallback ready"
            );
          }
        }
      })
      .catch((error) => {
        console.error(
          "[useSummary] Error checking Chrome availability:",
          error
        );
        if (mounted) {
          setIsChromeAvailable(false);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes("space") ||
            errorMessage.includes("enough space")
          ) {
            setAvailabilityError(errorMessage);
          }
        }
      });

    return () => {
      mounted = false;
    };
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

  // Progress callback
  const handleProgress = useCallback((progressData: SummarizationProgress) => {
    setStatus(progressData.status);
    setProgress(progressData.progress);
    setMessage(progressData.message);
  }, []);

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

  // Summarize function - uses the appropriate backend
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

      // Check if we can summarize (has available backends)
      if (!isChromeAvailable && !isTransformersAvailable) {
        setError("No hay ningún servicio de resumen disponible");
        setStatus("error");
        return;
      }

      const useType = type || defaultType;
      const useLength = length || defaultLength;

      setError(null);
      setSummaryType(useType);
      setSummaryLength(useLength);

      try {
        // Get content to summarize
        const contentToSummarize =
          article.scrapedContent ||
          article.content ||
          article.contentSnippet ||
          "";

        // Extract plain text (remove HTML)
        const textContent = extractTextForSummary(contentToSummarize);

        if (!textContent || textContent.length < 50) {
          throw new Error(
            "El contenido del artículo es demasiado corto para resumir"
          );
        }

        let resultSummary: string;

        // Determine which backend to use
        const useChrome =
          backend === "chrome" || (backend === "auto" && isChromeAvailable);
        const useTransformers =
          backend === "transformers" ||
          (backend === "auto" && !isChromeAvailable);

        if (useChrome && isChromeAvailable) {
          // Use Chrome Summarizer API
          setActiveBackend("chrome");
          const result = await summarizeText({
            text: textContent,
            type: useType,
            length: useLength,
            sharedContext: "This is a news article from an RSS feed.",
            context: `Article title: ${article.title}`,
            onProgress: handleProgress,
          });
          resultSummary = result.summary;
        } else if (useTransformers && isTransformersAvailable) {
          // Use Transformers.js
          setActiveBackend("transformers");
          const result = await summarizeWithTransformers({
            text: textContent,
            modelId,
            maxLength:
              useLength === "short" ? 75 : useLength === "long" ? 250 : 150,
            minLength:
              useLength === "short" ? 20 : useLength === "long" ? 80 : 40,
            onProgress: handleTransformersProgress,
          });
          resultSummary = result.summary;

          // Translate summary to Spanish if option enabled (Transformers.js only outputs English)
          if (translateSummary && resultSummary) {
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
              // Keep original English summary if translation fails
            }
          }
        } else {
          throw new Error("No hay ningún servicio de resumen disponible");
        }

        setSummary(resultSummary);
        setStatus("completed");
        setMessage("Resumen generado");
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
      handleProgress,
      handleTransformersProgress,
      defaultType,
      defaultLength,
      backend,
      isChromeAvailable,
      isTransformersAvailable,
      modelId,
      translateSummary,
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
    availabilityError,
    isChromeAvailable,
    isTransformersAvailable,
    activeBackend,
    canSummarize,
    hasCachedSummary,
    availableModels: SUMMARIZATION_MODELS,
    summarize,
    summarizeWithModel,
    clearSummary,
  };
}

// ============================================
// Utility Hook: Check Availability
// ============================================

export function useSummarizerAvailability() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isSummarizerAvailable()
      .then(setIsAvailable)
      .finally(() => setLoading(false));
  }, []);

  return { isAvailable, loading };
}
