/**
 * Summarization Service
 *
 * Provides article summarization using Chrome's Summarizer API (Gemini Nano)
 * Available from Chrome 138+
 *
 * @see https://developer.chrome.com/docs/ai/summarizer-api
 */

// ============================================
// Types
// ============================================

export type SummarizationStatus =
  | "idle" // No summarization requested
  | "checking" // Checking API availability
  | "downloading" // Downloading model (first time)
  | "summarizing" // Summarization in progress
  | "completed" // Summarization successful
  | "error" // Summarization failed
  | "unavailable"; // API not available

export type SummaryType = "key-points" | "tldr" | "teaser" | "headline";
export type SummaryLength = "short" | "medium" | "long";
export type SummaryFormat = "markdown" | "plain-text";

export interface SummarizationProgress {
  status: SummarizationStatus;
  progress: number; // 0-100 for download progress
  message: string;
}

export interface SummarizationResult {
  summary: string;
  type: SummaryType;
  length: SummaryLength;
  timestamp: number;
}

export interface SummarizationOptions {
  text: string;
  type?: SummaryType;
  length?: SummaryLength;
  format?: SummaryFormat;
  sharedContext?: string;
  context?: string;
  outputLanguage?: string;
  onProgress?: (progress: SummarizationProgress) => void;
}

// ============================================
// Summarizer Singleton
// ============================================

// Cache summarizers by configuration
const summarizerCache = new Map<string, Summarizer>();

function getSummarizerKey(
  type: SummaryType,
  length: SummaryLength,
  format: SummaryFormat,
  outputLanguage?: string
): string {
  return `${type}-${length}-${format}-${outputLanguage || "default"}`;
}

// ============================================
// API Availability Check
// ============================================

/**
 * Check if the Chrome Summarizer API is available
 */
export async function isSummarizerAvailable(): Promise<boolean> {
  // Check if running in browser
  if (typeof window === "undefined") {
    console.log("[Summarization] Not in browser environment");
    return false;
  }

  // Check if Summarizer API exists
  if (typeof Summarizer === "undefined") {
    console.log("[Summarization] Summarizer API not found. Chrome 138+ required.");
    console.log("[Summarization] Current user agent:", navigator.userAgent);
    
    // Try to detect Chrome version
    const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      const chromeVersion = parseInt(chromeMatch[1], 10);
      console.log(`[Summarization] Chrome version detected: ${chromeVersion} (need 138+)`);
    }
    
    return false;
  }

  try {
    const availability = await Summarizer.availability();
    console.log("[Summarization] API availability:", availability);
    return availability !== "unavailable";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("[Summarization] Error checking Summarizer availability:", errorMessage);
    
    // Check for specific error messages
    if (errorMessage.includes("enough space") || errorMessage.includes("space")) {
      console.error("[Summarization] Insufficient disk space. Chrome requires ~22GB free space.");
    }
    
    return false;
  }
}

/**
 * Get detailed availability status with error details
 */
export async function getSummarizerAvailability(): Promise<{
  status: SummarizerAvailability | "not-supported" | "insufficient-space";
  error?: string;
}> {
  if (typeof Summarizer === "undefined") {
    return { status: "not-supported" };
  }

  try {
    const availability = await Summarizer.availability();
    return { status: availability };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("[Summarization] Error checking Summarizer availability:", errorMessage);
    
    // Check for specific error messages
    if (errorMessage.includes("enough space") || errorMessage.includes("space")) {
      return { 
        status: "insufficient-space",
        error: errorMessage 
      };
    }
    
    return { status: "not-supported", error: errorMessage };
  }
}

// ============================================
// Summarization Functions
// ============================================

/**
 * Get or create a Summarizer instance with the specified configuration
 */
async function getOrCreateSummarizer(
  type: SummaryType = "tldr",
  length: SummaryLength = "medium",
  format: SummaryFormat = "plain-text",
  sharedContext?: string,
  outputLanguage?: string,
  onProgress?: (progress: SummarizationProgress) => void
): Promise<Summarizer | null> {
  const key = getSummarizerKey(type, length, format, outputLanguage);

  // Return cached summarizer if available
  if (summarizerCache.has(key)) {
    return summarizerCache.get(key)!;
  }

  // Check if API is available
  if (typeof Summarizer === "undefined") {
    return null;
  }

  try {
    const availability = await Summarizer.availability({
      type,
      format,
      length,
      outputLanguage,
    });

    if (availability === "unavailable") {
      return null;
    }

    onProgress?.({
      status: availability === "downloadable" ? "downloading" : "checking",
      progress: 0,
      message:
        availability === "downloadable"
          ? "Downloading summarization model..."
          : "Initializing summarizer...",
    });

    const summarizer = await Summarizer.create({
      type,
      format,
      length,
      sharedContext,
      outputLanguage,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          const progress =
            e.total > 0
              ? Math.round((e.loaded / e.total) * 100)
              : Math.round(e.loaded * 100);
          onProgress?.({
            status: "downloading",
            progress,
            message: `Downloading model: ${progress}%`,
          });
        });
      },
    });

    summarizerCache.set(key, summarizer);
    return summarizer;
  } catch (error) {
    console.error("[Summarization] Error creating Summarizer:", error);
    return null;
  }
}

/**
 * Summarize text using Chrome's Summarizer API
 */
export async function summarizeText(
  options: SummarizationOptions
): Promise<SummarizationResult> {
  const {
    text,
    type = "tldr",
    length = "medium",
    format = "plain-text",
    sharedContext,
    context,
    outputLanguage,
    onProgress,
  } = options;

  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for summarization");
  }

  onProgress?.({
    status: "checking",
    progress: 0,
    message: "Checking summarizer availability...",
  });

  const summarizer = await getOrCreateSummarizer(
    type,
    length,
    format,
    sharedContext,
    outputLanguage,
    onProgress
  );

  if (!summarizer) {
    throw new Error(
      "Chrome Summarizer API is not available. Please use Chrome 138 or later."
    );
  }

  onProgress?.({
    status: "summarizing",
    progress: 0,
    message: "Generating summary...",
  });

  try {
    const summary = await summarizer.summarize(text, { context });

    onProgress?.({
      status: "completed",
      progress: 100,
      message: "Summary generated",
    });

    return {
      summary,
      type,
      length,
      timestamp: Date.now(),
    };
  } catch (error) {
    onProgress?.({
      status: "error",
      progress: 0,
      message: error instanceof Error ? error.message : "Summarization failed",
    });
    throw error;
  }
}

/**
 * Summarize text with streaming output
 */
export async function summarizeTextStreaming(
  options: SummarizationOptions,
  onChunk: (chunk: string) => void
): Promise<SummarizationResult> {
  const {
    text,
    type = "tldr",
    length = "medium",
    format = "plain-text",
    sharedContext,
    context,
    outputLanguage,
    onProgress,
  } = options;

  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for summarization");
  }

  onProgress?.({
    status: "checking",
    progress: 0,
    message: "Checking summarizer availability...",
  });

  const summarizer = await getOrCreateSummarizer(
    type,
    length,
    format,
    sharedContext,
    outputLanguage,
    onProgress
  );

  if (!summarizer) {
    throw new Error(
      "Chrome Summarizer API is not available. Please use Chrome 138 or later."
    );
  }

  onProgress?.({
    status: "summarizing",
    progress: 0,
    message: "Generating summary...",
  });

  try {
    const stream = summarizer.summarizeStreaming(text, { context });
    let summary = "";

    // Use the AsyncIterator protocol for ReadableStream
    const reader = stream.getReader();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      summary = value; // Each chunk is the accumulated summary
      onChunk(summary);
    }

    onProgress?.({
      status: "completed",
      progress: 100,
      message: "Summary generated",
    });

    return {
      summary,
      type,
      length,
      timestamp: Date.now(),
    };
  } catch (error) {
    onProgress?.({
      status: "error",
      progress: 0,
      message: error instanceof Error ? error.message : "Summarization failed",
    });
    throw error;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Extract plain text from HTML for summarization
 */
export function extractTextForSummary(html: string): string {
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
 * Get a human-readable description of summary type
 */
export function getSummaryTypeDescription(type: SummaryType): string {
  const descriptions: Record<SummaryType, string> = {
    "key-points": "Key points as bullet list",
    tldr: "Quick summary (TL;DR)",
    teaser: "Engaging teaser to read more",
    headline: "Single headline",
  };
  return descriptions[type];
}

/**
 * Get a human-readable description of summary length
 */
export function getSummaryLengthDescription(
  type: SummaryType,
  length: SummaryLength
): string {
  const lengthMap: Record<SummaryType, Record<SummaryLength, string>> = {
    tldr: {
      short: "1 sentence",
      medium: "3 sentences",
      long: "5 sentences",
    },
    teaser: {
      short: "1 sentence",
      medium: "3 sentences",
      long: "5 sentences",
    },
    "key-points": {
      short: "3 bullet points",
      medium: "5 bullet points",
      long: "7 bullet points",
    },
    headline: {
      short: "~12 words",
      medium: "~17 words",
      long: "~22 words",
    },
  };
  return lengthMap[type][length];
}

/**
 * Clear cached summarizer instances
 */
export function clearSummarizerCache(): void {
  for (const summarizer of summarizerCache.values()) {
    try {
      summarizer.destroy();
    } catch (e) {
      // Ignore destroy errors
    }
  }
  summarizerCache.clear();
}

