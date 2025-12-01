/**
 * useTranslation Hook
 *
 * React hook for translating article content from English to Spanish
 * using the hybrid Chrome/Transformers.js translation service.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Article,
  updateArticleTranslation,
  updateArticleLanguage,
  getArticleById,
} from "@/lib/db";
import {
  translateToSpanish,
  detectLanguage,
  extractTextFromHtml,
  translateHtmlPreservingFormat,
  TranslationProgress,
  TranslationStatus,
  TranslationProvider,
  getAvailableProviders,
} from "@/lib/translation";

// ============================================
// Types
// ============================================

export interface UseTranslationOptions {
  /** Article to translate */
  article: Article | null;
  /** Automatically translate when article changes */
  autoTranslate?: boolean;
  /** Cache translations in IndexedDB */
  cacheTranslations?: boolean;
}

export interface UseTranslationReturn {
  /** Current translation status */
  status: TranslationStatus;
  /** Download/translation progress (0-100) */
  progress: number;
  /** Status message for UI */
  message: string;
  /** Translated title (or original if not translated) */
  translatedTitle: string;
  /** Translated content (or original if not translated) */
  translatedContent: string;
  /** Whether showing translated or original content */
  isShowingTranslation: boolean;
  /** Whether the article is in English (translatable) */
  isEnglish: boolean;
  /** Detected source language code */
  sourceLanguage: string;
  /** Provider used for translation */
  provider: TranslationProvider;
  /** Error message if translation failed */
  error: string | null;
  /** Whether translation is available (article exists and is English) */
  canTranslate: boolean;
  /** Whether cached translation exists */
  hasCachedTranslation: boolean;
  /** Start translation */
  translate: () => Promise<void>;
  /** Toggle between original and translated content */
  toggleTranslation: () => void;
  /** Clear cached translation */
  clearTranslation: () => void;
  /** Set source language manually */
  setSourceLanguage: (language: string) => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useTranslation(
  options: UseTranslationOptions
): UseTranslationReturn {
  const { article, autoTranslate = false, cacheTranslations = true } = options;

  // State
  const [status, setStatus] = useState<TranslationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedContent, setTranslatedContent] = useState("");
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [provider, setProvider] = useState<TranslationProvider>("none");
  const [error, setError] = useState<string | null>(null);
  const [hasCachedTranslation, setHasCachedTranslation] = useState(false);

  // Derived state
  const isEnglish = sourceLanguage === "en";
  const canTranslate =
    !!article &&
    sourceLanguage !== "es" &&
    sourceLanguage !== "unknown" &&
    status !== "translating" &&
    status !== "downloading";

  // Check for cached translation and detect language when article changes
  useEffect(() => {
    let isMounted = true;

    if (!article) {
      setStatus("idle");
      setTranslatedTitle("");
      setTranslatedContent("");
      setIsShowingTranslation(false);
      setSourceLanguage("en");
      setHasCachedTranslation(false);
      setError(null);
      return;
    }

    // Check for cached translation
    if (article.translatedTitle && article.translatedContent) {
      setTranslatedTitle(article.translatedTitle);
      setTranslatedContent(article.translatedContent);
      setHasCachedTranslation(true);
      // If we have a cached translation, we know it was translated from something to Spanish
      // We'll trust the article.originalLanguage if available, or default to 'en'
      setSourceLanguage(article.originalLanguage || "en");
      setStatus("completed");
    } else {
      setHasCachedTranslation(false);
      setTranslatedTitle("");
      setTranslatedContent("");
      setStatus("idle");

      // If article already has a manually set originalLanguage, use it
      if (article.originalLanguage && article.originalLanguage !== "unknown") {
        setSourceLanguage(article.originalLanguage);
      } else {
        // Detect language
        const detectArticleLanguage = async () => {
          // Include title in detection for better accuracy
          const contentToCheck =
            article.title +
            " " +
            (article.scrapedContent ||
              article.content ||
              article.contentSnippet ||
              "");
          const textContent = extractTextFromHtml(contentToCheck);

          if (textContent.length > 20) {
            const detection = await detectLanguage(textContent);
            // Only update state if still mounted
            if (isMounted) {
              // If detection returns 'unknown' but we have content, default to 'en'
              // to allow user to try translating if they want (though canTranslate blocks 'unknown')
              // Let's set it to detection.language and let canTranslate handle it
              setSourceLanguage(detection.language);
            }
          } else if (isMounted) {
            // Too short to detect, assume English for English-language feeds
            setSourceLanguage("en");
          }
        };

        detectArticleLanguage();
      }
    }

    // Reset showing state when article changes
    setIsShowingTranslation(false);

    return () => {
      isMounted = false;
    };
  }, [article]);

  // Auto-translate if enabled
  useEffect(() => {
    if (
      autoTranslate &&
      article &&
      sourceLanguage !== "es" &&
      sourceLanguage !== "unknown" &&
      !hasCachedTranslation &&
      status === "idle"
    ) {
      // Don't auto-translate immediately, wait a bit
      const timer = setTimeout(() => {
        translate();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTranslate, article?.id, sourceLanguage, hasCachedTranslation]);

  // Progress callback
  const handleProgress = useCallback((progressData: TranslationProgress) => {
    setStatus(progressData.status);
    setProgress(progressData.progress);
    setMessage(progressData.message);
  }, []);

  // Translate function
  const translate = useCallback(async () => {
    if (!article || !canTranslate) return;

    setError(null);

    try {
      // Get content to translate
      const contentToTranslate =
        article.scrapedContent ||
        article.content ||
        article.contentSnippet ||
        "";
      const textContent = extractTextFromHtml(contentToTranslate);

      if (!textContent || textContent.length < 10) {
        throw new Error("No content available to translate");
      }

      // Translate title
      setStatus("translating");
      setMessage("Translating title...");

      const titleResult = await translateToSpanish({
        text: article.title,
        onProgress: handleProgress,
        skipLanguageDetection: true, // Use the already detected language
        sourceLanguage: sourceLanguage,
      });

      // Translate content preserving HTML formatting
      setMessage("Translating content...");

      // Translating content (debugging info removed)

      const contentResult = await translateHtmlPreservingFormat(
        contentToTranslate,
        handleProgress,
        sourceLanguage
      );

      // Content translation result (debugging info removed)

      // Update state
      setTranslatedTitle(titleResult.translatedText);
      setTranslatedContent(contentResult.translatedText);
      setProvider(contentResult.provider);
      setStatus("completed");
      setMessage("Translation completed");
      setHasCachedTranslation(true);
      setIsShowingTranslation(true);

      // Cache in IndexedDB
      if (cacheTranslations && article.id) {
        try {
          await updateArticleTranslation(
            article.id,
            titleResult.translatedText,
            contentResult.translatedText,
            "es",
            sourceLanguage
          );
        } catch (cacheError) {
          console.warn(
            "[useTranslation] Failed to cache translation:",
            cacheError
          );
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Translation failed";
      setError(errorMessage);
      setStatus("error");
      setMessage(errorMessage);
    }
  }, [
    article,
    canTranslate,
    cacheTranslations,
    handleProgress,
    sourceLanguage,
  ]);

  // Toggle between original and translated
  const toggleTranslation = useCallback(() => {
    if (hasCachedTranslation || status === "completed") {
      setIsShowingTranslation((prev) => !prev);
    }
  }, [hasCachedTranslation, status]);

  // Clear cached translation
  const clearTranslation = useCallback(async () => {
    setTranslatedTitle("");
    setTranslatedContent("");
    setHasCachedTranslation(false);
    setIsShowingTranslation(false);
    setStatus("idle");
    setError(null);

    // Clear from IndexedDB
    if (article?.id && cacheTranslations) {
      try {
        const currentArticle = await getArticleById(article.id);
        if (currentArticle) {
          await updateArticleTranslation(article.id, "", "", "", "");
        }
      } catch (err) {
        console.warn(
          "[useTranslation] Failed to clear cached translation:",
          err
        );
      }
    }
  }, [article?.id, cacheTranslations]);

  // Set source language manually
  const setSourceLanguageManual = useCallback(
    async (language: string) => {
      setSourceLanguage(language);

      // If there's a cached translation and the language changed, clear it
      // so the user can retranslate with the correct language
      if (hasCachedTranslation && language !== article?.originalLanguage) {
        setTranslatedTitle("");
        setTranslatedContent("");
        setHasCachedTranslation(false);
        setIsShowingTranslation(false);
        setStatus("idle");

        // Clear from IndexedDB
        if (article?.id && cacheTranslations) {
          try {
            await updateArticleTranslation(article.id, "", "", "", "");
          } catch (err) {
            console.warn(
              "[useTranslation] Failed to clear cached translation:",
              err
            );
          }
        }
      }

      // Save to IndexedDB if article exists
      if (article?.id && cacheTranslations) {
        try {
          await updateArticleLanguage(article.id, language);
        } catch (err) {
          console.warn(
            "[useTranslation] Failed to update article language:",
            err
          );
        }
      }
    },
    [
      article?.id,
      article?.originalLanguage,
      cacheTranslations,
      hasCachedTranslation,
    ]
  );

  // Get displayed content
  const displayedTitle =
    isShowingTranslation && translatedTitle
      ? translatedTitle
      : article?.title || "";
  const displayedContent =
    isShowingTranslation && translatedContent
      ? translatedContent
      : article?.scrapedContent ||
        article?.content ||
        article?.contentSnippet ||
        "";

  return {
    status,
    progress,
    message,
    translatedTitle: displayedTitle,
    translatedContent: displayedContent,
    isShowingTranslation,
    isEnglish,
    sourceLanguage,
    provider,
    error,
    canTranslate,
    hasCachedTranslation,
    translate,
    toggleTranslation,
    clearTranslation,
    setSourceLanguage: setSourceLanguageManual,
  };
}

// ============================================
// Utility Hook: Available Providers
// ============================================

export function useTranslationProviders() {
  const [providers, setProviders] = useState<{
    chrome: boolean;
    transformers: boolean;
  }>({
    chrome: false,
    transformers: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableProviders()
      .then(setProviders)
      .finally(() => setLoading(false));
  }, []);

  return { providers, loading };
}
