/**
 * TypeScript declarations for Chrome's Built-in AI APIs
 * @see https://developer.chrome.com/docs/ai/translator-api
 * @see https://developer.chrome.com/docs/ai/language-detection
 */

declare global {
  // ============================================
  // Translator API (Chrome 138+)
  // ============================================

  type TranslatorAvailability =
    | "available"
    | "downloadable"
    | "downloading"
    | "unavailable";

  interface TranslatorAvailabilityOptions {
    sourceLanguage: string;
    targetLanguage: string;
  }

  interface TranslatorCreateOptions extends TranslatorAvailabilityOptions {
    monitor?: (monitor: TranslatorMonitor) => void;
  }

  interface TranslatorMonitor extends EventTarget {
    addEventListener(
      type: "downloadprogress",
      listener: (event: TranslatorDownloadProgressEvent) => void
    ): void;
    removeEventListener(
      type: "downloadprogress",
      listener: (event: TranslatorDownloadProgressEvent) => void
    ): void;
  }

  interface TranslatorDownloadProgressEvent extends Event {
    loaded: number;
    total: number;
  }

  interface Translator {
    translate(text: string): Promise<string>;
    translateStreaming(text: string): ReadableStream<string>;
    readonly sourceLanguage: string;
    readonly targetLanguage: string;
    destroy(): void;
  }

  interface TranslatorConstructor {
    availability(
      options: TranslatorAvailabilityOptions
    ): Promise<TranslatorAvailability>;
    create(options: TranslatorCreateOptions): Promise<Translator>;
  }

  // ============================================
  // Language Detector API (Chrome 138+)
  // ============================================

  type LanguageDetectorAvailability =
    | "available"
    | "downloadable"
    | "downloading"
    | "unavailable";

  interface LanguageDetectorCreateOptions {
    monitor?: (monitor: LanguageDetectorMonitor) => void;
  }

  interface LanguageDetectorMonitor extends EventTarget {
    addEventListener(
      type: "downloadprogress",
      listener: (event: LanguageDetectorDownloadProgressEvent) => void
    ): void;
    removeEventListener(
      type: "downloadprogress",
      listener: (event: LanguageDetectorDownloadProgressEvent) => void
    ): void;
  }

  interface LanguageDetectorDownloadProgressEvent extends Event {
    loaded: number;
    total: number;
  }

  interface LanguageDetectionResult {
    detectedLanguage: string;
    confidence: number;
  }

  interface LanguageDetector {
    detect(text: string): Promise<LanguageDetectionResult[]>;
    destroy(): void;
  }

  interface LanguageDetectorConstructor {
    availability(): Promise<LanguageDetectorAvailability>;
    create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;
  }

  // ============================================
  // Global declarations
  // ============================================

  const Translator: TranslatorConstructor | undefined;
  const LanguageDetector: LanguageDetectorConstructor | undefined;

  interface Window {
    Translator?: TranslatorConstructor;
    LanguageDetector?: LanguageDetectorConstructor;
  }
}

export {};
