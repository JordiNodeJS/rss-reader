/**
 * useSummary Hook
 *
 * React hook for generating AI summaries of article content.
 * Uses Transformers.js with DistilBART models for local summarization.
 * Summaries are generated in English and optionally translated to Spanish
 * using Chrome's native Translator API.
 */

"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { Article, updateArticleSummary, getArticleById } from "@/lib/db";
import {
  extractTextForSummary,
  SummarizationStatus,
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

export type SummarizationBackend = "transformers"; // Only Transformers.js is supported now

export interface UseSummaryOptions {
  /** Article to summarize */
  article: Article | null;
  /** Summary type (default: tldr) - Kept for API compatibility */
  type?: SummaryType;
  /** Summary length (default: medium) - Controls Transformers.js output length */
  length?: SummaryLength;
  /** Cache summaries in IndexedDB */
  cacheSummaries?: boolean;
  /** Backend is always 'transformers' now - kept for API compatibility */
  backend?: SummarizationBackend;
  /** Model to use for Transformers.js (default: distilbart-cnn-12-6) */
  modelId?: SummarizationModelKey;
  /** Translate summary to Spanish after generation (default: true) */
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
  /** Always false - Chrome Summarizer is no longer used */
  isChromeAvailable: boolean;
  /** Whether Transformers.js is available */
  isTransformersAvailable: boolean;
  /** Current active backend - always 'transformers' */
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
    modelId = "distilbart-cnn-12-6",
    translateSummary = true, // Default to true now - always translate to Spanish
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
  const [hasCachedSummary, setHasCachedSummary] = useState(false);
  const [activeBackend, setActiveBackend] =
    useState<SummarizationBackend | null>(null);

  // Derived state - can summarize if Transformers.js is available
  const canSummarize =
    !!article &&
    isTransformersAvailable &&
    status !== "summarizing" &&
    status !== "downloading";

  // Check Transformers.js availability on mount
  useEffect(() => {
    setIsTransformersAvailable(isTransformersSummarizationAvailable());
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

  // Summarize function - uses Transformers.js only
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

      // Check if we can summarize
      if (!isTransformersAvailable) {
        setError("Transformers.js no está disponible en este navegador");
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

        // Use Transformers.js for summarization
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
        let resultSummary = result.summary;

        // Translate summary to Spanish using Chrome Translator API
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
      handleTransformersProgress,
      defaultType,
      defaultLength,
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
    availabilityError: null, // Chrome Summarizer no longer used
    isChromeAvailable: false, // Chrome Summarizer no longer used
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
