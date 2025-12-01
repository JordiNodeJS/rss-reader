/**
 * Google Gemini API Integration for Summarization
 *
 * Uses Google's Gemini API for high-quality summarization.
 * This is an alternative to local Transformers.js models for users who prefer cloud-based AI.
 *
 * Recommended model: gemini-1.5-flash (fast, cheap, good for summarization)
 *
 * @see https://ai.google.dev/gemini-api/docs
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// ============================================
// Types
// ============================================

export type GeminiSummarizationStatus =
  | "idle"
  | "summarizing"
  | "completed"
  | "error";

export interface GeminiSummarizationProgress {
  status: GeminiSummarizationStatus;
  progress: number;
  message: string;
}

export interface GeminiSummarizationOptions {
  /** Text content to summarize */
  text: string;
  /** API key for Gemini */
  apiKey: string;
  /** Summary length: short (~50 words), medium (~100 words), long (~200 words), extended (~300 words) */
  length?: "short" | "medium" | "long" | "extended";
  /** Output language (default: 'es' for Spanish) */
  outputLanguage?: string;
  /** Progress callback */
  onProgress?: (progress: GeminiSummarizationProgress) => void;
}

export interface GeminiSummarizationResult {
  summary: string;
  model: string;
  tokensUsed?: number;
}

// ============================================
// Constants
// ============================================

// Using gemini-2.5-flash: Fast, cheap, good quality for summarization
// Note: gemini-1.5-flash was deprecated, replaced by gemini-2.5-flash
const GEMINI_MODEL = "gemini-2.5-flash";

// Length configuration for prompts
const LENGTH_CONFIG = {
  short: { words: 50, sentences: "2-3" },
  medium: { words: 100, sentences: "4-5" },
  long: { words: 200, sentences: "6-8" },
  extended: { words: 300, sentences: "8-12" },
};

// ============================================
// API Key Management
// ============================================

const API_KEY_STORAGE_KEY = "rss-reader-gemini-api-key";

/**
 * Store API key in localStorage (encrypted would be better for production)
 */
export function storeApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  try {
    // Basic obfuscation (not secure, but better than plain text)
    const encoded = btoa(apiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, encoded);
  } catch (e) {
    console.warn("Failed to store API key:", e);
  }
}

/**
 * Retrieve stored API key
 */
export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const encoded = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encoded) return null;
    return atob(encoded);
  } catch (e) {
    console.warn("Failed to retrieve API key:", e);
    return null;
  }
}

/**
 * Clear stored API key
 */
export function clearStoredApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear API key:", e);
  }
}

/**
 * Check if API key is stored
 */
export function hasStoredApiKey(): boolean {
  return getStoredApiKey() !== null;
}

// ============================================
// Gemini Client
// ============================================

let cachedClient: GoogleGenerativeAI | null = null;
let cachedModel: GenerativeModel | null = null;
let cachedApiKey: string | null = null;

function getGeminiModel(apiKey: string): GenerativeModel {
  // Reuse cached client if API key hasn't changed
  if (cachedClient && cachedModel && cachedApiKey === apiKey) {
    return cachedModel;
  }

  cachedClient = new GoogleGenerativeAI(apiKey);
  cachedModel = cachedClient.getGenerativeModel({ model: GEMINI_MODEL });
  cachedApiKey = apiKey;

  return cachedModel;
}

// ============================================
// Summarization Function
// ============================================

/**
 * Summarize text using Google Gemini API
 */
export async function summarizeWithGemini(
  options: GeminiSummarizationOptions
): Promise<GeminiSummarizationResult> {
  const {
    text,
    apiKey,
    length = "medium",
    outputLanguage = "es",
    onProgress,
  } = options;

  // Validate input
  if (!text || text.trim().length < 50) {
    throw new Error("El texto es demasiado corto para resumir");
  }

  if (!apiKey) {
    throw new Error("Se requiere una API key de Google Gemini");
  }

  // Report progress
  onProgress?.({
    status: "summarizing",
    progress: 10,
    message: "Conectando con Google Gemini...",
  });

  try {
    const model = getGeminiModel(apiKey);
    const config = LENGTH_CONFIG[length];

    // Construct the prompt
    const languageInstruction =
      outputLanguage === "es"
        ? "Escribe el resumen en español."
        : outputLanguage === "en"
        ? "Write the summary in English."
        : `Write the summary in ${outputLanguage}.`;

    const prompt = `Eres un experto en resumir artículos de noticias. Tu tarea es crear un resumen claro y conciso.

Instrucciones:
- Crea un resumen de aproximadamente ${config.words} palabras (${
      config.sentences
    } frases)
- Captura los puntos principales y la información más relevante
- Mantén un tono neutral e informativo
- ${languageInstruction}
- No incluyas introducciones como "Este artículo trata sobre..." o "En resumen..."
- Ve directo al contenido del resumen

Artículo a resumir:
${text.slice(0, 15000)}

Resumen:`;

    onProgress?.({
      status: "summarizing",
      progress: 30,
      message: "Generando resumen con IA...",
    });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    onProgress?.({
      status: "completed",
      progress: 100,
      message: "Resumen generado con Gemini",
    });

    return {
      summary: summary.trim(),
      model: GEMINI_MODEL,
      tokensUsed: response.usageMetadata?.totalTokenCount,
    };
  } catch (error) {
    onProgress?.({
      status: "error",
      progress: 0,
      message: error instanceof Error ? error.message : "Error desconocido",
    });

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("API_KEY_INVALID")) {
        throw new Error(
          "La API key de Gemini no es válida. Por favor, verifica tu configuración."
        );
      }
      if (error.message.includes("QUOTA_EXCEEDED")) {
        throw new Error(
          "Se ha excedido la cuota de la API. Intenta más tarde o usa el modelo local."
        );
      }
      if (error.message.includes("SAFETY")) {
        throw new Error("El contenido fue bloqueado por filtros de seguridad.");
      }
    }

    throw new Error(
      `Error al generar resumen con Gemini: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
}

/**
 * Validate an API key by making a simple request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const model = getGeminiModel(apiKey);
    // Make a minimal request to validate the key
    const result = await model.generateContent("Say 'ok'");
    await result.response;
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Gemini API is available (has valid stored key)
 */
export function isGeminiAvailable(): boolean {
  return hasStoredApiKey();
}
