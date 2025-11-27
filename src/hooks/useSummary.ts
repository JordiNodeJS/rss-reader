/**
 * useSummary Hook
 *
 * React hook for generating AI summaries of article content
 * using Chrome's Summarizer API (Gemini Nano - Chrome 138+)
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
} from "@/lib/summarization";

// ============================================
// Types
// ============================================

export interface UseSummaryOptions {
  /** Article to summarize */
  article: Article | null;
  /** Summary type (default: tldr) */
  type?: SummaryType;
  /** Summary length (default: medium) */
  length?: SummaryLength;
  /** Cache summaries in IndexedDB */
  cacheSummaries?: boolean;
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
  isAvailable: boolean;
  /** Whether summarization can be triggered */
  canSummarize: boolean;
  /** Whether cached summary exists */
  hasCachedSummary: boolean;
  /** Generate summary */
  summarize: (type?: SummaryType, length?: SummaryLength) => Promise<void>;
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
  } = options;

  // State
  const [status, setStatus] = useState<SummarizationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryType, setSummaryType] = useState<SummaryType>(defaultType);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>(defaultLength);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasCachedSummary, setHasCachedSummary] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Derived state
  const canSummarize =
    !!article &&
    isAvailable &&
    status !== "summarizing" &&
    status !== "downloading";

  // Check API availability on mount
  useEffect(() => {
    let mounted = true;
    
    // First check basic availability
    isSummarizerAvailable()
      .then((available) => {
        if (mounted) {
          setIsAvailable(available);
          if (!available) {
            // Get detailed availability info to check for specific errors
            getSummarizerAvailability()
              .then((result) => {
                if (mounted && result.status === "insufficient-space" && result.error) {
                  setAvailabilityError(result.error);
                  console.warn("[useSummary] Insufficient disk space detected:", result.error);
                } else if (mounted && result.error) {
                  setAvailabilityError(result.error);
                }
              })
              .catch(() => {
                // Ignore errors in detailed check
              });
            console.log("[useSummary] Summarizer API not available. Check browser console for details.");
          }
        }
      })
      .catch((error) => {
        console.error("[useSummary] Error checking availability:", error);
        if (mounted) {
          setIsAvailable(false);
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("space") || errorMessage.includes("enough space")) {
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

  // Summarize function
  const summarize = useCallback(
    async (type?: SummaryType, length?: SummaryLength) => {
      if (!article || !canSummarize) return;

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
          throw new Error("Article content is too short to summarize");
        }

        // Generate summary
        const result = await summarizeText({
          text: textContent,
          type: useType,
          length: useLength,
          sharedContext: "This is a news article from an RSS feed.",
          context: `Article title: ${article.title}`,
          onProgress: handleProgress,
        });

        setSummary(result.summary);
        setStatus("completed");
        setMessage("Summary generated");
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
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Summarization failed";
        setError(errorMessage);
        setStatus("error");
        setMessage(errorMessage);
      }
    },
    [article, canSummarize, cacheSummaries, handleProgress, defaultType, defaultLength]
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
    isAvailable,
    canSummarize,
    hasCachedSummary,
    summarize,
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

