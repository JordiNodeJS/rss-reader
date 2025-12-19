/**
 * Gemini Summarization API Route
 *
 * Provides a free proxy to Google Gemini API for summarization.
 * Rate limited to 5 requests per hour per IP to prevent abuse.
 *
 * Uses Upstash Redis for persistent rate limiting in production.
 * Falls back to in-memory store for development.
 *
 * @see docs/summarization-improvements-dec-2025.md
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Redis } from "@upstash/redis";
import {
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/constants";

// ============================================
// Configuration
// ============================================

const GEMINI_MODEL = "gemini-2.5-flash-lite";

// Length configuration for prompts
const LENGTH_CONFIG = {
  short: { words: 50, sentences: "2-3" },
  medium: { words: 100, sentences: "4-5" },
  long: { words: 200, sentences: "6-8" },
  extended: { words: 300, sentences: "8-12" },
} as const;

type SummaryLength = keyof typeof LENGTH_CONFIG;

// ============================================
// Rate Limiting with Upstash Redis
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Initialize Redis client if environment variables are set
let redis: Redis | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log("[API/summarize] Using Upstash Redis for rate limiting");
} else {
  console.log(
    "[API/summarize] Using in-memory rate limiting (set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for persistence)"
  );
}

// Fallback in-memory store for development
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (only for in-memory store)
setInterval(() => {
  if (redis) return; // Redis handles TTL automatically
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 10 * 60 * 1000);

function getClientIP(request: NextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback for development
  return "127.0.0.1";
}

/**
 * Check rate limit using Redis (persistent) or in-memory (fallback)
 */
async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const now = Date.now();
  const rateLimitKey = `ratelimit:summarize:${ip}`;

  // Use Redis if available
  if (redis) {
    try {
      const entry = await redis.get<RateLimitEntry>(rateLimitKey);

      // No entry or expired entry
      if (!entry || entry.resetAt < now) {
        const newEntry: RateLimitEntry = {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW_MS,
        };
        // Set with TTL so Redis auto-cleans expired entries
        await redis.set(rateLimitKey, newEntry, {
          ex: RATE_LIMIT_WINDOW_SECONDS,
        });
        return {
          allowed: true,
          remaining: RATE_LIMIT_REQUESTS - 1,
          resetAt: newEntry.resetAt,
        };
      }

      // Entry exists and not expired - check limit
      if (entry.count >= RATE_LIMIT_REQUESTS) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.resetAt,
        };
      }

      // Increment count
      entry.count++;
      const remainingTTL = Math.ceil((entry.resetAt - now) / 1000);
      await redis.set(rateLimitKey, entry, {
        ex: remainingTTL > 0 ? remainingTTL : 1,
      });

      return {
        allowed: true,
        remaining: RATE_LIMIT_REQUESTS - entry.count,
        resetAt: entry.resetAt,
      };
    } catch (error) {
      console.error(
        "[API/summarize] Redis error, falling back to in-memory:",
        error
      );
      // Fall through to in-memory store
    }
  }

  // Fallback: in-memory rate limiting
  const entry = rateLimitStore.get(ip);

  // No entry or expired entry
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(ip, newEntry);
    return {
      allowed: true,
      remaining: RATE_LIMIT_REQUESTS - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Entry exists and not expired
  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(ip, entry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

// ============================================
// Request Validation
// ============================================

interface SummarizeRequest {
  text: string;
  length?: SummaryLength;
}

function validateRequest(body: unknown):
  | {
      valid: true;
      data: SummarizeRequest;
    }
  | {
      valid: false;
      error: string;
    } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const { text, length } = body as Record<string, unknown>;

  if (!text || typeof text !== "string") {
    return { valid: false, error: "Missing or invalid 'text' field" };
  }

  if (text.length < 50) {
    return { valid: false, error: "Text must be at least 50 characters" };
  }

  if (text.length > 50000) {
    return { valid: false, error: "Text must be less than 50,000 characters" };
  }

  const validLengths = ["short", "medium", "long", "extended"];
  const summaryLength =
    length && validLengths.includes(length as string)
      ? (length as SummaryLength)
      : "medium";

  return {
    valid: true,
    data: {
      text: text.trim(),
      length: summaryLength,
    },
  };
}

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  console.log("[API/summarize] === NEW REQUEST ===", new Date().toISOString());

  // Check API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[API/summarize] GEMINI_API_KEY not configured");
    return NextResponse.json(
      { error: "Summarization service not configured" },
      { status: 503 }
    );
  }

  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(clientIP);

  const headers = new Headers({
    "X-RateLimit-Limit": RATE_LIMIT_REQUESTS.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": rateLimit.resetAt.toString(),
  });

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    headers.set("Retry-After", retryAfter.toString());

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Límite de ${RATE_LIMIT_REQUESTS} solicitudes por hora alcanzado. Intenta de nuevo en ${Math.ceil(
          retryAfter / 60
        )} minutos.`,
        retryAfter,
      },
      { status: 429, headers }
    );
  }

  // Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers }
    );
  }

  const validation = validateRequest(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400, headers }
    );
  }

  const { text, length } = validation.data;
  console.log("[API/summarize] Request validated:", {
    textLength: text.length,
    summaryLength: length,
    textPreview: text.slice(0, 100) + "...",
  });

  // Generate summary with Gemini
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const config = LENGTH_CONFIG[length || "medium"];

    const prompt = `Eres un experto en resumir artículos de noticias. Tu tarea es crear un resumen claro y conciso.

Instrucciones:
- Crea un resumen de aproximadamente ${config.words} palabras (${
      config.sentences
    } frases)
- Captura los puntos principales y la información más relevante
- Mantén un tono neutral e informativo
- Escribe el resumen en español
- No incluyas introducciones como "Este artículo trata sobre..." o "En resumen..."
- Ve directo al contenido del resumen

Artículo a resumir:
${text.slice(0, 15000)}

Resumen:`;

    console.log("[API/summarize] Calling Gemini API with model:", GEMINI_MODEL);
    console.log("[API/summarize] Prompt length:", prompt.length, "chars");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    console.log("[API/summarize] ✓ Success! Summary length:", summary.length);
    console.log(
      "[API/summarize] Tokens used:",
      response.usageMetadata?.totalTokenCount
    );

    return NextResponse.json(
      {
        summary,
        model: GEMINI_MODEL,
        length,
        tokensUsed: response.usageMetadata?.totalTokenCount,
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[API/summarize] === GEMINI ERROR ===");
    console.error("[API/summarize] Error object:", error);
    console.error("[API/summarize] Error type:", error?.constructor?.name);

    // Log full error details if available
    if (error && typeof error === "object") {
      console.error(
        "[API/summarize] Error details:",
        JSON.stringify(error, null, 2)
      );
    }

    // User-friendly error messages
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[API/summarize] Error message:", errorMessage);

    // Check for rate limit / quota exceeded (429 errors)
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests") ||
      errorMessage.includes("RESOURCE_EXHAUSTED")
    ) {
      const retryMatch = errorMessage.match(/retry in (\d+)/i);
      const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 60;
      return NextResponse.json(
        {
          error: "Cuota de Gemini agotada temporalmente",
          message: `La API de Google Gemini está limitada. Intenta de nuevo en ${retryAfter} segundos.`,
          retryAfter,
        },
        { status: 429, headers }
      );
    }

    if (errorMessage.includes("API_KEY_INVALID")) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 503, headers }
      );
    }

    if (errorMessage.includes("QUOTA_EXCEEDED")) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Try again later." },
        { status: 503, headers }
      );
    }

    if (errorMessage.includes("SAFETY")) {
      return NextResponse.json(
        { error: "Content blocked by safety filters" },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500, headers }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    {
      error: "Method not allowed",
      message: "Use POST to summarize text. See docs for usage.",
      usage: {
        method: "POST",
        body: {
          text: "Article content to summarize (required, min 50 chars)",
          length:
            "short | medium | long | extended (optional, default: medium)",
        },
        limits: {
          requestsPerHour: RATE_LIMIT_REQUESTS,
          maxTextLength: 50000,
        },
      },
    },
    { status: 405 }
  );
}
