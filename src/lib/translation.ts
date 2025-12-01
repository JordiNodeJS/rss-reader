/**
 * Translation Service
 *
 * Provides multi-language to Spanish translation using:
 * 1. Chrome's native Translator API (preferred, offline-capable)
 * 2. Google Gemini API (fallback, requires API key)
 *
 * @see docs/research/ai-api-lang.md for detailed documentation
 */

// Types are declared in src/types/chrome-ai.d.ts as ambient types

import {
  translateWithGemini,
  getStoredApiKey as getGeminiApiKey,
  isGeminiAvailable,
} from "./summarization-gemini";

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

export type TranslationProvider = "chrome" | "gemini" | "transformers" | "none";

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
  isSpanish: boolean;
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

const SPANISH_COMMON_WORDS = new Set([
  "el",
  "la",
  "de",
  "que",
  "y",
  "a",
  "en",
  "un",
  "ser",
  "se",
  "no",
  "haber",
  "por",
  "con",
  "su",
  "para",
  "como",
  "estar",
  "tener",
  "le",
  "lo",
  "todo",
  "pero",
  "más",
  "hacer",
  "o",
  "poder",
  "decir",
  "este",
  "ir",
  "otro",
  "ese",
  "la",
  "si",
  "me",
  "ya",
  "ver",
  "porque",
  "dar",
  "cuando",
  "él",
  "muy",
  "sin",
  "vez",
  "mucho",
  "saber",
  "qué",
  "sobre",
  "mi",
  "alguno",
  "mismo",
  "yo",
  "también",
  "hasta",
]);

const FRENCH_COMMON_WORDS = new Set([
  "le",
  "de",
  "un",
  "à",
  "être",
  "et",
  "en",
  "avoir",
  "que",
  "pour",
  "dans",
  "ce",
  "il",
  "qui",
  "ne",
  "sur",
  "se",
  "pas",
  "plus",
  "pouvoir",
  "par",
  "je",
  "avec",
  "tout",
  "faire",
  "son",
  "mettre",
  "autre",
  "on",
  "mais",
  "nous",
  "comme",
  "ou",
  "si",
  "leur",
  "y",
  "dire",
  "elle",
  "devoir",
  "avant",
  "deux",
  "même",
  "prendre",
  "aussi",
  "celui",
  "donner",
  "bien",
  "où",
  "fois",
  "vous",
  // Additional common French words
  "les",
  "des",
  "est",
  "sont",
  "une",
  "trois",
  "quatre",
  "cinq",
  "budget",
  "sécu",
  "syndicats",
  "médecins",
  "libéraux",
  "cette",
  "cet",
  "ces",
  "sans",
  "sous",
  "entre",
  "jusqu",
  "depuis",
  "pendant",
  "contre",
  "selon",
  "selon",
  "vers",
  "chez",
  "malgré",
  "grâce",
  "afin",
  "alors",
  "donc",
  "car",
  "puisque",
  "quand",
  "lorsque",
  "tandis",
  "toutefois",
  "cependant",
  "néanmoins",
  "ainsi",
  "alors",
  "déjà",
  "encore",
  "jamais",
  "toujours",
  "souvent",
  "parfois",
  "quelquefois",
  "beaucoup",
  "peu",
  "très",
  "trop",
  "assez",
  "plutôt",
  "vraiment",
  "certainement",
  "probablement",
  "peut-être",
  "sûrement",
]);

const GERMAN_COMMON_WORDS = new Set([
  "der",
  "die",
  "und",
  "in",
  "den",
  "von",
  "zu",
  "das",
  "mit",
  "sich",
  "des",
  "auf",
  "für",
  "ist",
  "im",
  "dem",
  "nicht",
  "ein",
  "eine",
  "als",
  "auch",
  "es",
  "an",
  "werden",
  "aus",
  "er",
  "hat",
  "dass",
  "sie",
  "nach",
  "wird",
  "bei",
  "einer",
  "um",
  "am",
  "sind",
  "noch",
  "wie",
  "einem",
  "über",
  "einen",
  "so",
  "zum",
  "war",
  "haben",
  "nur",
  "oder",
  "aber",
  "vor",
  "zur",
]);

const PORTUGUESE_COMMON_WORDS = new Set([
  "de",
  "a",
  "o",
  "que",
  "e",
  "do",
  "da",
  "em",
  "um",
  "para",
  "com",
  "não",
  "uma",
  "os",
  "no",
  "se",
  "na",
  "por",
  "mais",
  "as",
  "dos",
  "como",
  "mas",
  "ao",
  "ele",
  "das",
  "à",
  "seu",
  "sua",
  "ou",
  "quando",
  "muito",
  "nos",
  "já",
  "eu",
  "também",
  "só",
  "pelo",
  "pela",
  "até",
  "isso",
  "ela",
  "entre",
  "depois",
  "sem",
  "mesmo",
  "aos",
  "ter",
  "seus",
  "quem",
]);

const ITALIAN_COMMON_WORDS = new Set([
  "di",
  "a",
  "il",
  "un",
  "è",
  "per",
  "una",
  "in",
  "sono",
  "ho",
  "ha",
  "che",
  "non",
  "si",
  "la",
  "da",
  "lo",
  "con",
  "ma",
  "come",
  "questo",
  "qui",
  "quello",
  "lei",
  "lui",
  "mi",
  "io",
  "se",
  "molto",
  "anche",
  "solo",
  "cosa",
  "dove",
  "quando",
  "ora",
  "adesso",
  "perché",
  "noi",
  "voi",
  "loro",
  "tutto",
  "niente",
  "bene",
  "male",
  "grazie",
  "prego",
  "ciao",
  "sì",
]);

const CONFIDENCE_THRESHOLD = 0.7;
const MAX_CHUNK_LENGTH = 500; // Characters per chunk for translation

// ============================================
// Translation Types (kept for compatibility, but simplified)
// ============================================

// Note: Transformers.js is no longer used for translation.
// These variables are kept for cache management compatibility.
const transformersPipelines: Map<string, unknown> = new Map();
const transformersLoadPromises: Map<string, unknown> = new Map();

// ============================================
// Chrome Translator API Wrapper
// ============================================

// Cache translators by "source-target" key
const chromeTranslators: Map<string, Translator> = new Map();

async function getChromeTranslator(
  sourceLanguage: string = "en",
  onProgress?: (progress: number) => void
): Promise<Translator | null> {
  const targetLanguage = "es";
  const key = `${sourceLanguage}-${targetLanguage}`;

  // Check if already initialized
  if (chromeTranslators.has(key)) return chromeTranslators.get(key)!;

  // Check if API is available
  if (typeof Translator === "undefined") return null;

  try {
    const availability = await Translator.availability({
      sourceLanguage,
      targetLanguage,
    });

    if (availability === "unavailable") return null;

    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage,
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

    chromeTranslators.set(key, translator);
    return translator;
  } catch (error) {
    console.warn(
      `[Translation] Chrome Translator API error (${sourceLanguage}->${targetLanguage}):`,
      error
    );
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
 * Heuristic-based language detection fallback
 */
function detectLanguageHeuristic(text: string): LanguageDetectionResult {
  const words = text
    .toLowerCase()
    .replace(/[^a-zà-ÿ\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) {
    return {
      language: "unknown",
      confidence: 0,
      isEnglish: false,
      isSpanish: false,
    };
  }

  const languages = [
    { code: "en", words: ENGLISH_COMMON_WORDS },
    { code: "es", words: SPANISH_COMMON_WORDS },
    { code: "fr", words: FRENCH_COMMON_WORDS },
    { code: "de", words: GERMAN_COMMON_WORDS },
    { code: "pt", words: PORTUGUESE_COMMON_WORDS },
    { code: "it", words: ITALIAN_COMMON_WORDS },
  ];

  let bestLang = "unknown";
  let maxScore = 0;
  const scores: Record<string, number> = {};

  for (const lang of languages) {
    const matchCount = words.filter((w) => lang.words.has(w)).length;
    // Use a more lenient scoring: divide by actual word count (up to 100 words)
    // This gives better results for shorter texts
    const score = matchCount / Math.min(words.length, 100);
    scores[lang.code] = score;

    if (score > maxScore) {
      maxScore = score;
      bestLang = lang.code;
    }
  }

  // Lower threshold for better detection (was 0.15, now 0.1)
  // This helps detect languages even with shorter texts
  if (maxScore < 0.1) {
    return {
      language: "unknown",
      confidence: maxScore,
      isEnglish: false,
      isSpanish: false,
    };
  }

  // If scores are very close, prefer the language with more matches
  // This helps avoid false positives when multiple languages have similar scores
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  // If top two scores are within 0.05 of each other, check for more specific indicators
  if (
    sortedScores.length >= 2 &&
    sortedScores[0][1] - sortedScores[1][1] < 0.05
  ) {
    // Check for French-specific patterns
    const frenchPatterns =
      /\b(les|des|est|sont|pour|avec|dans|sur|par|une|deux|trois|quatre|cinq|budget|sécu|syndicats|médecins|libéraux)\b/i;
    if (frenchPatterns.test(text)) {
      bestLang = "fr";
      maxScore = Math.max(maxScore, sortedScores[0][1] + 0.1);
    }
  }

  return {
    language: bestLang,
    confidence: Math.min(maxScore, 1),
    isEnglish: bestLang === "en",
    isSpanish: bestLang === "es",
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
        const result = {
          language: topResult.detectedLanguage,
          confidence: topResult.confidence,
          isEnglish:
            topResult.detectedLanguage === "en" &&
            topResult.confidence > CONFIDENCE_THRESHOLD,
          isSpanish:
            topResult.detectedLanguage === "es" &&
            topResult.confidence > CONFIDENCE_THRESHOLD,
        };
        // Chrome Language Detection result (debug details removed)
        return result;
      }
    } catch (error) {
      console.warn("[Translation] Chrome Language Detection failed:", error);
    }
  }

  // Fallback to heuristic
  const heuristicResult = detectLanguageHeuristic(sampleText);
  // Heuristic language detection result (debug details removed)
  return heuristicResult;
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
 * Clean translation artifacts from Chrome Translator API output
 *
 * Chrome Translator internally uses placeholder tags like [[tag_X]] to preserve
 * HTML structure during translation. Sometimes these tags leak into the output.
 * This function removes them and cleans up any resulting formatting issues.
 *
 * @param text - The translated text that may contain artifact tags
 * @returns Clean text without translation artifacts
 */
function cleanTranslationArtifacts(text: string): string {
  const cleaned = text
    // Remove [[tag_X]] patterns (with or without spaces around them)
    .replace(/\s*\[\[tag_\d+\]\]\s*/gi, " ")
    // Remove [[/tag_X]] closing patterns
    .replace(/\s*\[\[\/tag_\d+\]\]\s*/gi, " ")
    // Remove {tag_X} patterns (alternative format)
    .replace(/\s*\{tag_\d+\}\s*/gi, " ")
    // Remove {{tag_X}} patterns (double braces variant)
    .replace(/\s*\{\{tag_\d+\}\}\s*/gi, " ")
    // Remove <tag_X> patterns that might slip through
    .replace(/\s*<\/?tag_\d+>\s*/gi, " ")
    // Remove [X] numbered placeholders that sometimes appear
    .replace(/\s*\[\d+\]\s*/gi, " ")
    // Remove {X} numbered placeholders
    .replace(/\s*\{\d+\}\s*/gi, " ")
    // Clean up multiple consecutive spaces
    .replace(/\s{2,}/g, " ")
    // Clean up spaces before punctuation
    .replace(/\s+([.,;:!?)])/g, "$1")
    // Clean up spaces after opening punctuation
    .replace(/([(["])\s+/g, "$1")
    // Trim the result
    .trim();

  return cleaned;
}

/**
 * Translate text using Chrome Translator API
 */
async function translateWithChrome(
  text: string,
  sourceLanguage: string = "en",
  onProgress?: (progress: TranslationProgress) => void
): Promise<string> {
  const translator = await getChromeTranslator(
    sourceLanguage,
    (downloadProgress) => {
      onProgress?.({
        status: "downloading",
        progress: downloadProgress,
        message: `Downloading translation model: ${downloadProgress}%`,
      });
    }
  );

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
    // Clean translation artifacts from each chunk
    const cleanedTranslation = cleanTranslationArtifacts(translated);
    translatedChunks.push(cleanedTranslation);

    onProgress?.({
      status: "translating",
      progress: Math.round(((i + 1) / chunks.length) * 100),
      message: `Translating... ${i + 1}/${chunks.length}`,
    });
  }

  // Join chunks and do a final cleanup pass
  const result = translatedChunks.join(" ");
  return cleanTranslationArtifacts(result);
}

// ============================================
// Main Translation API
// ============================================

export interface TranslateOptions {
  text: string;
  onProgress?: (progress: TranslationProgress) => void;
  preferredProvider?: TranslationProvider; // 'chrome' or 'gemini'
  skipLanguageDetection?: boolean; // Skip language detection if already verified
  sourceLanguage?: string; // Explicitly set source language
}

/**
 * Translate text to Spanish using Chrome's native Translator API or Gemini API
 *
 * Priority: Chrome Translator (if available) → Gemini API (if key stored)
 */
export async function translateToSpanish(
  options: TranslateOptions
): Promise<TranslationResult> {
  const {
    text,
    onProgress,
    preferredProvider,
    skipLanguageDetection = false,
    sourceLanguage: explicitSourceLanguage,
  } = options;

  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for translation");
  }

  let sourceLanguage = explicitSourceLanguage || "en";

  // Only detect language if not skipped and no explicit source language provided
  if (!skipLanguageDetection && !explicitSourceLanguage) {
    onProgress?.({
      status: "detecting",
      progress: 0,
      message: "Detecting language...",
    });

    // Detect language first
    const detection = await detectLanguage(text);

    if (detection.isSpanish) {
      throw new Error(
        `Text is already in Spanish (confidence: ${(
          detection.confidence * 100
        ).toFixed(1)}%)`
      );
    }

    // If detected language is known and supported, use it
    if (detection.language !== "unknown") {
      sourceLanguage = detection.language;
    }
  }

  // Try Chrome Translator first (unless Gemini is explicitly preferred)
  if (preferredProvider !== "gemini") {
    try {
      const translatedText = await translateWithChrome(
        text,
        sourceLanguage,
        onProgress
      );

      onProgress?.({
        status: "completed",
        progress: 100,
        message: "Translation completed",
      });

      return {
        translatedText,
        provider: "chrome",
        sourceLanguage,
        targetLanguage: "es",
        timestamp: Date.now(),
      };
    } catch (chromeError) {
      const chromeErrorMessage =
        chromeError instanceof Error
          ? chromeError.message
          : String(chromeError);
      console.warn(
        `[Translation] Chrome Translator not available for ${sourceLanguage}->es:`,
        chromeErrorMessage
      );

      // If Chrome fails and Gemini is not available, throw the Chrome error
      if (!isGeminiAvailable()) {
        onProgress?.({
          status: "error",
          progress: 0,
          message: `Chrome Translator no disponible: ${chromeErrorMessage}`,
        });

        throw new Error(
          `Chrome Translator API no disponible para ${sourceLanguage}→es. ` +
            `Asegúrate de usar Chrome 131+ y que los modelos de traducción estén descargados, ` +
            `o configura una API key de Gemini en Configuración de IA.`
        );
      }
      // Fall through to Gemini
    }
  }

  // Try Gemini API as fallback or if explicitly preferred
  if (isGeminiAvailable()) {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        onProgress?.({
          status: "translating",
          progress: 10,
          message: "Traduciendo con Gemini...",
        });

        const result = await translateWithGemini({
          text,
          sourceLanguage,
          targetLanguage: "es",
          apiKey,
          onProgress: (geminiProgress) => {
            onProgress?.({
              status:
                geminiProgress.status === "completed"
                  ? "completed"
                  : "translating",
              progress: geminiProgress.progress,
              message: geminiProgress.message,
            });
          },
        });

        onProgress?.({
          status: "completed",
          progress: 100,
          message: "Traducción completada con Gemini",
        });

        return {
          translatedText: result.translatedText,
          provider: "gemini",
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
          timestamp: Date.now(),
        };
      } catch (geminiError) {
        const geminiErrorMessage =
          geminiError instanceof Error
            ? geminiError.message
            : String(geminiError);
        console.error(
          "[Translation] Gemini translation failed:",
          geminiErrorMessage
        );

        onProgress?.({
          status: "error",
          progress: 0,
          message: `Error en traducción Gemini: ${geminiErrorMessage}`,
        });

        throw new Error(`Error al traducir con Gemini: ${geminiErrorMessage}`);
      }
    }
  }

  // No translation provider available
  throw new Error(
    `No hay proveedores de traducción disponibles. ` +
      `Chrome Translator API requiere Chrome 131+, o configura una API key de Gemini.`
  );
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check which translation providers are available
 */
export async function getAvailableProviders(): Promise<{
  chrome: boolean;
  gemini: boolean;
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
    gemini: isGeminiAvailable(),
    transformers: false, // Transformers.js no longer used for translation
  };
}

/**
 * Check if Chrome Translator API is potentially available
 * This is a synchronous check that doesn't verify model availability
 */
export function isChromeTranslatorAvailable(): boolean {
  return typeof Translator !== "undefined";
}

/**
 * Pre-load translation model for faster subsequent translations
 * Note: Only Chrome Translator API is supported now
 */
export async function preloadTranslationModel(
  onProgress?: (progress: number) => void
): Promise<TranslationProvider> {
  // Only Chrome Translator is supported
  const chromeTranslator = await getChromeTranslator("en", onProgress);
  if (chromeTranslator) return "chrome";

  throw new Error(
    "Chrome Translator API no disponible. " +
      "Asegúrate de usar Chrome 131+ y que los modelos de traducción estén instalados."
  );
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
  onProgress?: (progress: TranslationProgress) => void,
  sourceLanguage?: string
): Promise<TranslationResult> {
  // Use the format-preserving translation
  return translateHtmlPreservingFormat(html, onProgress, sourceLanguage);
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
  onProgress?: (progress: TranslationProgress) => void,
  sourceLanguage?: string
): Promise<TranslationResult> {
  // translateHtmlPreservingFormat called (debug log removed)
  // translateHtmlPreservingFormat: HTML length (debug removed)

  if (!html || html.trim().length === 0) {
    return {
      translatedText: "",
      provider: "none",
      sourceLanguage: sourceLanguage || "en",
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
  // translateHtmlPreservingFormat calling translateToSpanish (debug logs removed)

  const result = await translateToSpanish({
    text: processedHtml,
    onProgress,
    skipLanguageDetection: true,
    sourceLanguage,
  });

  // Translation result received (debug details removed)

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
  transformersPipelines.clear();
  transformersLoadPromises.clear();
  chromeTranslators.clear();
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

export interface CachedModel {
  id: string;
  size: number;
  fileCount: number;
  source: "transformers" | "chrome";
}

/**
 * Check Chrome Translator API availability for common language pairs
 */
export async function getChromeTranslatorModels(): Promise<CachedModel[]> {
  const models: CachedModel[] = [];

  // Check if Chrome Translator API is available
  if (typeof Translator === "undefined") return models;

  // Common language pairs to check (source -> es)
  const languagePairs = [
    { source: "en", name: "English → Spanish" },
    { source: "fr", name: "French → Spanish" },
    { source: "de", name: "German → Spanish" },
    { source: "it", name: "Italian → Spanish" },
    { source: "pt", name: "Portuguese → Spanish" },
  ];

  for (const pair of languagePairs) {
    try {
      const availability = await Translator.availability({
        sourceLanguage: pair.source,
        targetLanguage: "es",
      });

      // "available" means downloaded, "downloadable" means not yet downloaded
      if (availability === "available") {
        models.push({
          id: `Chrome Translator: ${pair.name}`,
          size: 0, // Chrome doesn't expose size
          fileCount: 1,
          source: "chrome",
        });
      }
    } catch {
      // Ignore errors for unsupported pairs
    }
  }

  // Check Language Detector
  if (typeof LanguageDetector !== "undefined") {
    try {
      const availability = await LanguageDetector.availability();
      if (availability === "available") {
        models.push({
          id: "Chrome Language Detector",
          size: 0,
          fileCount: 1,
          source: "chrome",
        });
      }
    } catch {
      // Ignore
    }
  }

  return models;
}

/**
 * Get list of downloaded models and their sizes
 */
export async function getDownloadedModels(): Promise<CachedModel[]> {
  if (typeof caches === "undefined") return [];

  const cacheNames = await caches.keys();
  // Scanning caches (debug log removed)

  const modelMap = new Map<string, { size: number; fileCount: number }>();

  for (const cacheName of cacheNames) {
    // More inclusive filter for AI models
    // Transformers.js usually uses 'transformers-cache', but let's be safe
    const isLikelyModelCache =
      cacheName.toLowerCase().includes("transformers") ||
      cacheName.toLowerCase().includes("onnx") ||
      cacheName.toLowerCase().includes("huggingface") ||
      cacheName.toLowerCase().includes("xenova") ||
      cacheName.toLowerCase().includes("model");

    if (!isLikelyModelCache) {
      continue;
    }

    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const url = new URL(request.url);
        const parts = url.pathname.split("/");

        // Heuristic to find model ID (e.g. Owner/ModelName)
        let modelId = "Unknown Model";

        // Strategy 1: Look for "resolve" pattern common in HuggingFace URLs
        // .../Owner/Model/resolve/...
        const resolveIndex = parts.indexOf("resolve");
        if (resolveIndex > 2) {
          modelId = `${parts[resolveIndex - 2]}/${parts[resolveIndex - 1]}`;
        }
        // Strategy 2: Look for Xenova models explicitly
        else {
          const xenovaIdx = parts.indexOf("Xenova");
          const xenovaLowerIdx = parts.findIndex(
            (p) => p.toLowerCase() === "xenova"
          );

          if (xenovaIdx !== -1 && parts[xenovaIdx + 1]) {
            modelId = `Xenova/${parts[xenovaIdx + 1]}`;
          } else if (xenovaLowerIdx !== -1 && parts[xenovaLowerIdx + 1]) {
            modelId = `Xenova/${parts[xenovaLowerIdx + 1]}`;
          } else if (url.hostname === "huggingface.co" && parts.length >= 3) {
            // Fallback: assume path starts with Owner/Model
            // parts[0] is empty because pathname starts with /
            modelId = `${parts[1]}/${parts[2]}`;
          }
        }

        // Fallback Strategy 3: Use cache name if URL parsing failed
        if (modelId === "Unknown Model" || modelId.includes("undefined")) {
          modelId = `Cache: ${cacheName}`;
        }

        // Get size
        let size = 0;
        try {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            size = blob.size;
          }
        } catch {
          console.warn("Failed to get size for", request.url);
        }

        const current = modelMap.get(modelId) || { size: 0, fileCount: 0 };
        modelMap.set(modelId, {
          size: current.size + size,
          fileCount: current.fileCount + 1,
        });
      }
    } catch (err) {
      console.error(`[CacheManager] Error reading cache ${cacheName}:`, err);
    }
  }

  return Array.from(modelMap.entries()).map(([id, data]) => ({
    id,
    ...data,
    source: "transformers" as const,
  }));
}

/**
 * Get all raw cache names (for debugging)
 */
export async function getAllCacheNames(): Promise<string[]> {
  if (typeof caches === "undefined") return [];
  try {
    return await caches.keys();
  } catch (e) {
    console.error("Failed to get cache keys:", e);
    return [];
  }
}

/**
 * Diagnostic function to check available methods on Chrome Translator API
 */
async function diagnoseChromeTranslatorAPI(): Promise<void> {
  if (typeof Translator === "undefined") {
    // Translator API not available
    return;
  }

  // Translator API available. Methods check (debug logs removed)
  // Translator prototype information (debug removed)

  // Check if deleteModel exists
  // Translator.deleteModel check (debug removed)

  if (typeof LanguageDetector !== "undefined") {
    // LanguageDetector.deleteModel check (debug removed)
  }

  // Check storage APIs
  if (typeof navigator !== "undefined" && navigator.storage) {
    // navigator.storage availability check (debug removed)
    if (navigator.storage.estimate) {
      await navigator.storage.estimate();
      // Storage estimate (debug removed)
    }
  }

  // Check IndexedDB for Chrome Translator storage
  if (typeof indexedDB !== "undefined") {
    const databases = await indexedDB.databases?.();
    if (databases) {
      // Filter Chrome Translator related IndexedDB databases (debug removed)
      databases.filter(
        (db) =>
          db.name?.toLowerCase().includes("translator") ||
          db.name?.toLowerCase().includes("chrome") ||
          db.name?.toLowerCase().includes("on-device")
      );
    }
  }
}

/**
 * Delete a specific Chrome Translator model from memory and storage
 *
 * Note: Chrome Translator API doesn't provide a direct deleteModel() method.
 * Models are stored in Chrome's internal storage which is not directly accessible.
 * We can only:
 * 1. Destroy the Translator instance (clears from memory)
 * 2. Try to use deleteModel() if it exists (may not be available)
 * 3. The model will remain "available" until Chrome's internal cache management removes it
 */
async function deleteChromeModel(modelId: string): Promise<void> {
  if (typeof Translator === "undefined") return;

  // Run diagnostics first time to understand what's available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deleteChromeModelAny = deleteChromeModel as any;
  if (!deleteChromeModelAny.diagnosticsRun) {
    await diagnoseChromeTranslatorAPI();
    deleteChromeModelAny.diagnosticsRun = true;
  }

  // Handle Language Detector
  if (modelId.includes("Language Detector")) {
    // Destroy the detector instance if it exists
    if (chromeLanguageDetector) {
      try {
        chromeLanguageDetector.destroy();
        // Language Detector instance destroyed
      } catch (error) {
        console.warn(
          "[Translation] Error destroying Language Detector:",
          error
        );
      }
      chromeLanguageDetector = null;
    }

    // Try to use deleteModel() if available
    try {
      if (
        typeof LanguageDetector !== "undefined" &&
        LanguageDetector.deleteModel
      ) {
        await LanguageDetector.deleteModel();
        // Language Detector model deleted via deleteModel() (debug removed)
        return;
      }
    } catch (error) {
      console.warn(
        "[Translation] deleteModel() not available or failed for Language Detector:",
        error
      );
    }

    console.warn(
      "[Translation] Language Detector: Only cleared from memory. Model may still be 'available' in Chrome storage."
    );
    return;
  }

  // Extract language pair from modelId
  // Format: "Chrome Translator: English → Spanish"
  const match = modelId.match(/Chrome Translator: (\w+) → Spanish/);
  if (!match) {
    // If we can't parse the model ID, try to clear all chrome translators
    console.warn(
      "[Translation] Could not parse model ID, clearing all translators"
    );
    for (const translator of chromeTranslators.values()) {
      try {
        translator.destroy();
      } catch (error) {
        console.warn("[Translation] Error destroying Translator:", error);
      }
    }
    chromeTranslators.clear();
    return;
  }

  const sourceLang = match[1].toLowerCase();
  // Map common language names to codes
  const langMap: Record<string, string> = {
    english: "en",
    french: "fr",
    german: "de",
    italian: "it",
    portuguese: "pt",
  };
  const sourceCode = langMap[sourceLang] || "en";
  const targetCode = "es";
  const key = `${sourceCode}-${targetCode}`;

  // Attempting to delete Chrome Translator model (debug log removed)

  // Destroy the Translator instance if it exists
  const translator = chromeTranslators.get(key);
  if (translator) {
    try {
      translator.destroy();
    } catch (error) {
      console.warn(
        `[Translation] Error destroying Translator (${key}):`,
        error
      );
    }
    chromeTranslators.delete(key);
  } else {
    // No Translator instance found in memory for this key (debug removed)
  }

  // Try to use deleteModel() if available
  // This should actually remove the model from browser storage
  try {
    if (Translator.deleteModel) {
      await Translator.deleteModel({
        sourceLanguage: sourceCode,
        targetLanguage: targetCode,
      });
      // Model deleted via deleteModel() (debug removed)

      // Verify deletion by checking availability
      const availability = await Translator.availability({
        sourceLanguage: sourceCode,
        targetLanguage: targetCode,
      });
      // Model availability after deleteModel() (debug removed)

      if (availability === "available") {
        console.warn(
          `[Translation] ⚠️ Model still shows as 'available' after deleteModel(). Chrome may cache it internally.`
        );
      }
    } else {
      console.warn(
        "[Translation] ⚠️ Translator.deleteModel() not available. Model will persist in Chrome's internal storage."
      );
      console.warn(
        "[Translation] 💡 Tip: Use chrome://on-device-translation-internals/ to manage models manually."
      );
    }
  } catch (error) {
    console.warn(
      `[Translation] deleteModel() failed for ${sourceCode}->${targetCode}:`,
      error
    );
  }

  // Final verification
  try {
    const finalAvailability = await Translator.availability({
      sourceLanguage: sourceCode,
      targetLanguage: targetCode,
    });
    // Final model availability check (debug removed)

    if (finalAvailability === "available") {
      console.warn(
        `[Translation] ⚠️ Model ${sourceCode}->${targetCode} is still 'available' after deletion attempt.`
      );
      console.warn(
        "[Translation] This is expected - Chrome Translator API stores models in internal storage that cannot be directly accessed."
      );
      console.warn(
        "[Translation] The model will be re-used from Chrome's cache on next translation request."
      );
    }
  } catch (error) {
    console.warn("[Translation] Error checking final availability:", error);
  }
}

/**
 * Delete a specific model from cache
 */
export async function deleteModel(modelId: string): Promise<void> {
  // Handle Chrome models
  if (modelId.startsWith("Chrome ")) {
    await deleteChromeModel(modelId);
    return;
  }

  // Handle Transformers.js models
  if (typeof caches === "undefined") return;

  const cacheNames = await caches.keys();

  // Also clear from in-memory pipelines if it matches
  for (const [key] of transformersPipelines) {
    if (
      key.includes(modelId) ||
      (modelId.startsWith("Cache: ") &&
        key.includes(modelId.replace("Cache: ", "")))
    ) {
      transformersPipelines.delete(key);
    }
  }

  // Clear loading promises
  for (const [key] of transformersLoadPromises) {
    if (
      key.includes(modelId) ||
      (modelId.startsWith("Cache: ") &&
        key.includes(modelId.replace("Cache: ", "")))
    ) {
      transformersLoadPromises.delete(key);
    }
  }

  for (const cacheName of cacheNames) {
    // If the modelId is actually a cache name (Fallback Strategy 3)
    if (modelId === `Cache: ${cacheName}`) {
      await caches.delete(cacheName);
      continue;
    }

    const isLikelyModelCache =
      cacheName.toLowerCase().includes("transformers") ||
      cacheName.toLowerCase().includes("onnx") ||
      cacheName.toLowerCase().includes("huggingface") ||
      cacheName.toLowerCase().includes("xenova") ||
      cacheName.toLowerCase().includes("model");

    if (isLikelyModelCache) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      let deletedCount = 0;

      for (const request of requests) {
        if (request.url.includes(modelId)) {
          await cache.delete(request);
          deletedCount++;
        }
      }

      // Check if cache is empty after deletions
      const remaining = await cache.keys();
      if (remaining.length === 0 && deletedCount > 0) {
        await caches.delete(cacheName);
      }
    }
  }
}
