/**
 * Translation Service
 *
 * Provides English to Spanish translation using a hybrid approach:
 * 1. Chrome's Translator API (primary) - fastest, best quality
 * 2. Transformers.js with Opus-MT (fallback) - cross-browser support
 *
 * @see docs/research/ai-api-lang.md for detailed documentation
 */

// Types are declared in src/types/chrome-ai.d.ts as ambient types
import { logDBEvent } from "@/lib/db-monitor";

// ============================================
// Types
// ============================================

export type TranslationStatus =
  | "idle" // No translation requested
  | "detecting" // Detecting source language
  | "downloading" // Downloading model (first time)
  | "translating" // Translation in progress
  | "completed" // Translation successful
  | "error"; // Translation failed

export type TranslationProvider = "chrome" | "transformers" | "none";

export interface TranslationProgress {
  status: TranslationStatus;
  progress: number; // 0-100 for download progress
  message: string;
}

export interface TranslationResult {
  translatedText: string;
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  isEnglish: boolean;
}

// ============================================
// Constants
// ============================================

const ENGLISH_COMMON_WORDS = new Set([
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "is",
  "are",
  "was",
  "were",
  "been",
  "has",
  "had",
  "can",
  "could",
  "should",
  "would",
  "may",
  "might",
  "must",
  "shall",
  "when",
  "where",
  "which",
  "who",
  "how",
]);

const CONFIDENCE_THRESHOLD = 0.7;
const MAX_CHUNK_LENGTH = 500; // Characters per chunk for translation

// ============================================
// Transformers.js Pipeline (lazy loaded)
// ============================================

type TranslationPipeline = (
  text: string
) => Promise<Array<{ translation_text: string }>>;

let transformersPipeline: TranslationPipeline | null = null;
let transformersLoadPromise: Promise<TranslationPipeline> | null = null;

async function loadTransformersPipeline(
  onProgress?: (progress: number) => void
): Promise<TranslationPipeline> {
  if (transformersPipeline) return transformersPipeline;
  if (transformersLoadPromise) return transformersLoadPromise;

  transformersLoadPromise = (async () => {
    try {
      // Dynamic import to avoid loading if Chrome API is available
      const { pipeline, env } = await import("@huggingface/transformers");

      // Configure cache
      env.allowLocalModels = true;

      // Load the model with progress callback
      const translator = await pipeline("translation", "Xenova/opus-mt-en-es", {
        dtype: "q8", // Quantized for smaller size
        progress_callback: (data: { progress?: number; status?: string }) => {
          if (data.progress !== undefined && onProgress) {
            onProgress(Math.round(data.progress));
          }
        },
      });

      transformersPipeline = translator as unknown as TranslationPipeline;
      return transformersPipeline;
    } catch (error) {
      transformersLoadPromise = null;
      throw error;
    }
  })();

  return transformersLoadPromise;
}

// ============================================
// Chrome Translator API Wrapper
// ============================================

let chromeTranslator: Translator | null = null;

async function getChromeTranslator(
  onProgress?: (progress: number) => void
): Promise<Translator | null> {
  // Check if already initialized
  if (chromeTranslator) return chromeTranslator;

  // Check if API is available
  if (typeof Translator === "undefined") return null;

  try {
    const availability = await Translator.availability({
      sourceLanguage: "en",
      targetLanguage: "es",
    });

    if (availability === "unavailable") return null;

    chromeTranslator = await Translator.create({
      sourceLanguage: "en",
      targetLanguage: "es",
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          if (onProgress) {
            const progress =
              e.total > 0
                ? Math.round((e.loaded / e.total) * 100)
                : Math.round(e.loaded * 100);
            onProgress(progress);
          }
        });
      },
    });

    return chromeTranslator;
  } catch (error) {
    console.warn("[Translation] Chrome Translator API error:", error);
    return null;
  }
}

// ============================================
// Language Detection
// ============================================

let chromeLanguageDetector: LanguageDetector | null = null;

async function getChromeLanguageDetector(): Promise<LanguageDetector | null> {
  if (chromeLanguageDetector) return chromeLanguageDetector;

  if (typeof LanguageDetector === "undefined") return null;

  try {
    const availability = await LanguageDetector.availability();
    if (availability === "unavailable") return null;

    chromeLanguageDetector = await LanguageDetector.create();
    return chromeLanguageDetector;
  } catch (error) {
    console.warn("[Translation] Chrome Language Detector API error:", error);
    return null;
  }
}

/**
 * Heuristic-based English detection fallback
 */
function detectEnglishHeuristic(text: string): LanguageDetectionResult {
  const words = text
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) {
    return { language: "unknown", confidence: 0, isEnglish: false };
  }

  const englishWordCount = words.filter((w) =>
    ENGLISH_COMMON_WORDS.has(w)
  ).length;
  const confidence = Math.min(englishWordCount / Math.min(words.length, 50), 1);

  return {
    language: confidence > 0.15 ? "en" : "unknown",
    confidence,
    isEnglish: confidence > 0.15,
  };
}

/**
 * Detect the language of the given text
 */
export async function detectLanguage(
  text: string
): Promise<LanguageDetectionResult> {
  // Use only first 1000 characters for detection (performance)
  const sampleText = text.slice(0, 1000);

  // Try Chrome API first
  const detector = await getChromeLanguageDetector();
  if (detector) {
    try {
      const results = await detector.detect(sampleText);
      const topResult = results[0];

      if (topResult) {
        return {
          language: topResult.detectedLanguage,
          confidence: topResult.confidence,
          isEnglish:
            topResult.detectedLanguage === "en" &&
            topResult.confidence > CONFIDENCE_THRESHOLD,
        };
      }
    } catch (error) {
      console.warn("[Translation] Chrome Language Detection failed:", error);
    }
  }

  // Fallback to heuristic
  return detectEnglishHeuristic(sampleText);
}

// ============================================
// Translation Functions
// ============================================

/**
 * Split text into chunks for translation
 */
function splitIntoChunks(
  text: string,
  maxLength: number = MAX_CHUNK_LENGTH
): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence + " ";
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Translate text using Chrome Translator API
 */
async function translateWithChrome(
  text: string,
  onProgress?: (progress: TranslationProgress) => void
): Promise<string> {
  const translator = await getChromeTranslator((downloadProgress) => {
    onProgress?.({
      status: "downloading",
      progress: downloadProgress,
      message: `Downloading translation model: ${downloadProgress}%`,
    });
  });

  if (!translator) {
    throw new Error("Chrome Translator not available");
  }

  onProgress?.({
    status: "translating",
    progress: 0,
    message: "Translating...",
  });

  // For long texts, split and translate in chunks
  const chunks = splitIntoChunks(text);
  const translatedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const translated = await translator.translate(chunks[i]);
    translatedChunks.push(translated);

    onProgress?.({
      status: "translating",
      progress: Math.round(((i + 1) / chunks.length) * 100),
      message: `Translating... ${i + 1}/${chunks.length}`,
    });
  }

  return translatedChunks.join(" ");
}

/**
 * Translate text using Transformers.js
 */
async function translateWithTransformers(
  text: string,
  onProgress?: (progress: TranslationProgress) => void
): Promise<string> {
  const pipeline = await loadTransformersPipeline((downloadProgress) => {
    onProgress?.({
      status: "downloading",
      progress: downloadProgress,
      message: `Downloading translation model: ${downloadProgress}%`,
    });
  });

  onProgress?.({
    status: "translating",
    progress: 0,
    message: "Translating...",
  });

  // Split into chunks for better quality
  const chunks = splitIntoChunks(text);
  const translatedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const result = await pipeline(chunks[i]);
    translatedChunks.push(result[0].translation_text);

    onProgress?.({
      status: "translating",
      progress: Math.round(((i + 1) / chunks.length) * 100),
      message: `Translating... ${i + 1}/${chunks.length}`,
    });
  }

  return translatedChunks.join(" ");
}

// ============================================
// Main Translation API
// ============================================

export interface TranslateOptions {
  text: string;
  onProgress?: (progress: TranslationProgress) => void;
  preferredProvider?: TranslationProvider;
  skipLanguageDetection?: boolean; // Skip language detection if already verified
}

/**
 * Translate English text to Spanish
 *
 * Uses Chrome Translator API when available, falls back to Transformers.js
 */
export async function translateToSpanish(
  options: TranslateOptions
): Promise<TranslationResult> {
  const {
    text,
    onProgress,
    preferredProvider,
    skipLanguageDetection = false,
  } = options;

  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for translation");
  }

  // Only detect language if not skipped
  if (!skipLanguageDetection) {
    onProgress?.({
      status: "detecting",
      progress: 0,
      message: "Detecting language...",
    });

    // Detect language first
    const detection = await detectLanguage(text);

    if (!detection.isEnglish) {
      throw new Error(
        `Text does not appear to be in English (detected: ${
          detection.language
        }, confidence: ${(detection.confidence * 100).toFixed(1)}%)`
      );
    }
  }

  // Try Chrome API first (unless explicitly requesting transformers)
  if (preferredProvider !== "transformers") {
    try {
      const translatedText = await translateWithChrome(text, onProgress);

      onProgress?.({
        status: "completed",
        progress: 100,
        message: "Translation completed",
      });

      return {
        translatedText,
        provider: "chrome",
        sourceLanguage: "en",
        targetLanguage: "es",
        timestamp: Date.now(),
      };
    } catch (error) {
      console.info(
        "[Translation] Chrome API unavailable, falling back to Transformers.js:",
        error
      );
    }
  }

  // Fallback to Transformers.js
  try {
    const translatedText = await translateWithTransformers(text, onProgress);

    onProgress?.({
      status: "completed",
      progress: 100,
      message: "Translation completed",
    });

    return {
      translatedText,
      provider: "transformers",
      sourceLanguage: "en",
      targetLanguage: "es",
      timestamp: Date.now(),
    };
  } catch (error) {
    onProgress?.({
      status: "error",
      progress: 0,
      message: error instanceof Error ? error.message : "Translation failed",
    });
    throw error;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check which translation providers are available
 */
export async function getAvailableProviders(): Promise<{
  chrome: boolean;
  transformers: boolean;
}> {
  const chromeAvailable =
    typeof Translator !== "undefined" &&
    (await Translator.availability({
      sourceLanguage: "en",
      targetLanguage: "es",
    })) !== "unavailable";

  return {
    chrome: chromeAvailable,
    transformers: true, // Always available as fallback (lazy loaded)
  };
}

/**
 * Pre-load translation model for faster subsequent translations
 */
export async function preloadTranslationModel(
  onProgress?: (progress: number) => void
): Promise<TranslationProvider> {
  // Try Chrome first
  const chromeTranslator = await getChromeTranslator(onProgress);
  if (chromeTranslator) return "chrome";

  // Otherwise preload Transformers.js
  await loadTransformersPipeline(onProgress);
  return "transformers";
}

/**
 * Extract plain text from HTML content
 */
export function extractTextFromHtml(html: string): string {
  // Create a temporary div to parse HTML
  if (typeof document === "undefined") {
    // Server-side: basic tag stripping
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Client-side: proper HTML parsing
  const div = document.createElement("div");
  div.innerHTML = html;

  // Remove scripts and styles
  div.querySelectorAll("script, style").forEach((el) => el.remove());

  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

/**
 * Translate HTML content while preserving basic structure (bold, italic, links, etc.)
 *
 * This function translates text segments while preserving HTML tags.
 * It handles common inline formatting tags like <b>, <strong>, <i>, <em>, <a>, <br>, etc.
 */
export async function translateHtml(
  html: string,
  onProgress?: (progress: TranslationProgress) => void
): Promise<TranslationResult> {
  // Use the format-preserving translation
  return translateHtmlPreservingFormat(html, onProgress);
}

/**
 * Translate HTML while preserving basic formatting tags
 *
 * Strategy:
 * 1. Replace inline tags with placeholders
 * 2. Translate the text
 * 3. Restore the tags from placeholders
 */
export async function translateHtmlPreservingFormat(
  html: string,
  onProgress?: (progress: TranslationProgress) => void
): Promise<TranslationResult> {
  if (!html || html.trim().length === 0) {
    return {
      translatedText: "",
      provider: "none",
      sourceLanguage: "en",
      targetLanguage: "es",
      timestamp: Date.now(),
    };
  }

  // Tags to preserve (inline formatting)
  const preserveTags = [
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "del",
    "ins",
    "mark",
    "small",
    "sub",
    "sup",
    "code",
    "kbd",
    "var",
    "samp",
    "abbr",
    "cite",
    "dfn",
    "q",
    "time",
    "span",
  ];

  // Store tags and their positions
  const tagMap: Map<string, string> = new Map();
  let placeholderIndex = 0;

  // Function to create a placeholder
  const createPlaceholder = (tag: string): string => {
    const placeholder = `[[TAG_${placeholderIndex}]]`;
    tagMap.set(placeholder, tag);
    placeholderIndex++;
    return placeholder;
  };

  // Replace tags with placeholders
  let processedHtml = html;

  // Preserve self-closing tags and line breaks
  processedHtml = processedHtml.replace(/<br\s*\/?>/gi, () =>
    createPlaceholder("<br>")
  );
  processedHtml = processedHtml.replace(/<hr\s*\/?>/gi, () =>
    createPlaceholder("<hr>")
  );

  // Preserve anchor tags with their attributes
  processedHtml = processedHtml.replace(
    /<a\s+([^>]*)>(.*?)<\/a>/gi,
    (match, attrs, content) => {
      const openTag = createPlaceholder(`<a ${attrs}>`);
      const closeTag = createPlaceholder("</a>");
      return `${openTag}${content}${closeTag}`;
    }
  );

  // Preserve image tags
  processedHtml = processedHtml.replace(/<img\s+[^>]*>/gi, (match) =>
    createPlaceholder(match)
  );

  // Preserve other inline formatting tags
  for (const tag of preserveTags) {
    // Opening tags (with possible attributes)
    const openRegex = new RegExp(`<${tag}(\\s+[^>]*)?>`, "gi");
    processedHtml = processedHtml.replace(openRegex, (match) =>
      createPlaceholder(match)
    );

    // Closing tags
    const closeRegex = new RegExp(`</${tag}>`, "gi");
    processedHtml = processedHtml.replace(closeRegex, () =>
      createPlaceholder(`</${tag}>`)
    );
  }

  // Remove block-level tags but keep their content (p, div, etc.)
  // These will be handled by the content structure
  processedHtml = processedHtml
    .replace(
      /<\/?(?:p|div|article|section|header|footer|main|aside|nav|figure|figcaption)(?:\s+[^>]*)?>/gi,
      "\n"
    )
    .replace(/<\/?(?:ul|ol|li)(?:\s+[^>]*)?>/gi, "\n")
    .replace(/<\/?(?:h[1-6])(?:\s+[^>]*)?>/gi, "\n")
    .replace(/<\/?blockquote(?:\s+[^>]*)?>/gi, "\n");

  // Remove any remaining HTML tags that weren't preserved
  processedHtml = processedHtml.replace(/<[^>]+>/g, "");

  // Clean up whitespace but preserve placeholders
  processedHtml = processedHtml.replace(/\n{3,}/g, "\n\n").trim();

  // Translate the processed text
  const result = await translateToSpanish({
    text: processedHtml,
    onProgress,
    skipLanguageDetection: true,
  });

  // Restore tags from placeholders
  let translatedHtml = result.translatedText;
  for (const [placeholder, tag] of tagMap.entries()) {
    translatedHtml = translatedHtml.replace(placeholder, tag);
  }

  // Clean up any leftover placeholder artifacts
  translatedHtml = translatedHtml.replace(/\[\[TAG_\d+\]\]/g, "");

  // Wrap paragraphs (split by double newlines)
  const paragraphs = translatedHtml.split(/\n\n+/);
  if (paragraphs.length > 1) {
    translatedHtml = paragraphs
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join("\n");
  }

  return {
    ...result,
    translatedText: translatedHtml,
  };
}

/**
 * Clear the cached translation model from memory and IndexedDB
 * This frees up memory and forces a re-download on next use
 */
export async function clearTranslationModelCache(): Promise<void> {
  // Clear in-memory instances
  transformersPipeline = null;
  transformersLoadPromise = null;
  chromeTranslator = null;
  chromeLanguageDetector = null;

  // Clear IndexedDB cache used by Transformers.js
  if (typeof indexedDB !== "undefined") {
    const databases = await indexedDB.databases?.();
    if (databases) {
      for (const db of databases) {
        if (
          db.name &&
          (db.name.includes("transformers") ||
            db.name.includes("onnx") ||
            db.name.includes("huggingface"))
        ) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    }
  }

  // Clear Cache API storage used by Transformers.js
  if (typeof caches !== "undefined") {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (
        name.includes("transformers") ||
        name.includes("onnx") ||
        name.includes("huggingface")
      ) {
        await caches.delete(name);
      }
    }
  }
}

/**
 * Get estimated size of cached translation models
 */
export async function getTranslationCacheSize(): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return "Unknown";
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usedMB = Math.round((estimate.usage || 0) / (1024 * 1024));
    return `~${usedMB} MB`;
  } catch {
    return "Unknown";
  }
}
