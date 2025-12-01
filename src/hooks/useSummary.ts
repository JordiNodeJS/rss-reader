/**
 * useSummary Hook
 *
 * React hook for generating AI summaries of article content.
 * Uses Transformers.js with DistilBART models for local summarization (supports `short`, `medium`, `long` and `extended` lengths).
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

export type SummarizationBackend = "transformers" | "gemini";
export type SummarizationProvider = "local" | "gemini";

export interface UseSummaryOptions {
  /** Article to summarize */
  article: Article | null;
  /** Summary type (default: tldr) - Kept for API compatibility */
  type?: SummaryType;
  /** Summary length (default: medium) - Controls Transformers.js output length */
  length?: SummaryLength;
  /** Cache summaries in IndexedDB */
  cacheSummaries?: boolean;
  /** Provider to use: 'local' for Transformers.js, 'gemini' for Google Gemini API */
  provider?: SummarizationProvider;
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
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [hasCachedSummary, setHasCachedSummary] = useState(false);
  const [activeBackend, setActiveBackend] =
    useState<SummarizationBackend | null>(null);

  // Derived state - can summarize if either Transformers.js or Gemini is available
  const canSummarize =
    !!article &&
    (isTransformersAvailable || geminiAvailable) &&
    status !== "summarizing" &&
    status !== "downloading";

  // Check availability on mount
  useEffect(() => {
    setIsTransformersAvailable(isTransformersSummarizationAvailable());
    setGeminiAvailable(isGeminiAvailable());
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

  // Summarize function - uses Transformers.js or Gemini based on provider
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

      // Use Gemini if provider is 'gemini' and available
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

      // Fallback to Transformers.js
      if (!isTransformersAvailable) {
        setError("Transformers.js no está disponible en este navegador");
        setStatus("error");
        return;
      }

      try {
        // Detect language of the original article to determine if translation is needed
        // The summarization model (DistilBART) is trained on English, so it will produce
        // English summaries even for non-English content. We need to translate to Spanish.
        let needsTranslation = translateSummary;

        try {
          const detection = await detectLanguage(textContent);
          // Always translate to Spanish unless it's already in Spanish AND translation is disabled
          // If the article is in Spanish, the model still produces English output, so we need to translate
          needsTranslation = translateSummary || !detection.isSpanish;
        } catch {
          // If language detection fails, assume translation is needed
          needsTranslation = true;
        }

        // Use Transformers.js for summarization
        setActiveBackend("transformers");

        // Calculate maxLength and minLength based on summary length
        // extended: 400-500 tokens for comprehensive summaries that aid comprehension
        const lengthConfig = {
          short: { maxLength: 75, minLength: 20 },
          medium: { maxLength: 150, minLength: 40 },
          long: { maxLength: 250, minLength: 80 },
          extended: { maxLength: 500, minLength: 150 },
        };
        const { maxLength, minLength } = lengthConfig[useLength];

        // Use larger model (bart-large-cnn) for extended summaries for better quality
        // The larger model has better vocabulary and produces less repetitive text
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

        // Always translate summary to Spanish using Chrome Translator API
        // The DistilBART model always produces English output regardless of input language
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
            // Prefix the summary to indicate it's in English
            resultSummary = `[Resumen en inglés - traducción no disponible]\n\n${resultSummary}`;
          }
        }

        setSummary(resultSummary);
        setStatus("completed");
        setMessage(
          translationFailed
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
    isGeminiAvailable: geminiAvailable,
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
