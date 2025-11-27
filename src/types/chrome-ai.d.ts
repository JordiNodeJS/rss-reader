/**
 * TypeScript declarations for Chrome's Built-in AI APIs
 * @see https://developer.chrome.com/docs/ai/translator-api
 * @see https://developer.chrome.com/docs/ai/language-detection
 * @see https://developer.chrome.com/docs/ai/summarizer-api
 */

declare global {
  // ============================================
  // Summarizer API (Chrome 138+)
  // ============================================

  type SummarizerAvailability =
    | "available"
    | "downloadable"
    | "downloading"
    | "unavailable";

  type SummarizerType = "key-points" | "tldr" | "teaser" | "headline";
  type SummarizerFormat = "markdown" | "plain-text";
  type SummarizerLength = "short" | "medium" | "long";

  interface SummarizerAvailabilityOptions {
    type?: SummarizerType;
    format?: SummarizerFormat;
    length?: SummarizerLength;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
  }

  interface SummarizerCreateOptions extends SummarizerAvailabilityOptions {
    sharedContext?: string;
    monitor?: (monitor: SummarizerMonitor) => void;
  }

  interface SummarizerMonitor extends EventTarget {
    addEventListener(
      type: "downloadprogress",
      listener: (event: SummarizerDownloadProgressEvent) => void
    ): void;
    removeEventListener(
      type: "downloadprogress",
      listener: (event: SummarizerDownloadProgressEvent) => void
    ): void;
  }

  interface SummarizerDownloadProgressEvent extends Event {
    loaded: number;
    total: number;
  }

  interface SummarizerSummarizeOptions {
    context?: string;
  }

  interface Summarizer {
    summarize(
      text: string,
      options?: SummarizerSummarizeOptions
    ): Promise<string>;
    summarizeStreaming(
      text: string,
      options?: SummarizerSummarizeOptions
    ): ReadableStream<string>;
    readonly sharedContext: string;
    readonly type: SummarizerType;
    readonly format: SummarizerFormat;
    readonly length: SummarizerLength;
    destroy(): void;
  }

  interface SummarizerConstructor {
    availability(
      options?: SummarizerAvailabilityOptions
    ): Promise<SummarizerAvailability>;
    create(options?: SummarizerCreateOptions): Promise<Summarizer>;
  }

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
    // Optional method to delete a downloaded model (may not be available in all Chrome versions)
    deleteModel?(
      options: TranslatorAvailabilityOptions
    ): Promise<void>;
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
    // Optional method to delete a downloaded model (may not be available in all Chrome versions)
    deleteModel?(): Promise<void>;
  }

  // ============================================
  // Global declarations
  // ============================================

  const Summarizer: SummarizerConstructor | undefined;
  const Translator: TranslatorConstructor | undefined;
  const LanguageDetector: LanguageDetectorConstructor | undefined;

  interface Window {
    Summarizer?: SummarizerConstructor;
    Translator?: TranslatorConstructor;
    LanguageDetector?: LanguageDetectorConstructor;
  }
}

export {};
