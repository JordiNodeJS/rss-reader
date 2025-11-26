import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

// Custom parser with extended fields for Spanish news sites
const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
    "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
  },
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["media:group", "media:group"],
      ["enclosure", "enclosure"],
      ["content:encoded", "content:encoded"],
      ["media:keywords", "media:keywords"],
      ["category", "categories", { keepArray: true }],
    ],
  },
});

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Error types for better HTTP status codes
type FeedErrorType =
  | "not_found"
  | "invalid_xml"
  | "timeout"
  | "network"
  | "invalid_feed"
  | "unknown";

interface FeedError {
  type: FeedErrorType;
  status: number;
  userMessage: string;
  details: string;
}

function classifyError(error: unknown): FeedError {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorString = errorMessage.toLowerCase();

  // 404 - Feed not found
  if (
    errorString.includes("404") ||
    errorString.includes("not found") ||
    errorString.includes("status code 404")
  ) {
    return {
      type: "not_found",
      status: 404,
      userMessage:
        "Feed not found. The RSS feed URL may have changed or been removed.",
      details: errorMessage,
    };
  }

  // 422 - Invalid XML/malformed feed
  if (
    errorString.includes("invalid xml") ||
    errorString.includes("attribute without value") ||
    errorString.includes("unexpected close tag") ||
    errorString.includes("unclosed") ||
    errorString.includes("not well-formed") ||
    errorString.includes("parsing")
  ) {
    return {
      type: "invalid_xml",
      status: 422,
      userMessage:
        "The RSS feed contains invalid XML. The feed may be malformed or temporarily broken.",
      details: errorMessage,
    };
  }

  // 504 - Timeout
  if (
    errorString.includes("timeout") ||
    errorString.includes("etimedout") ||
    errorString.includes("timedout") ||
    errorString.includes("aborted")
  ) {
    return {
      type: "timeout",
      status: 504,
      userMessage:
        "Request timed out. The feed server is too slow or unavailable.",
      details: errorMessage,
    };
  }

  // 502 - Network/DNS errors
  if (
    errorString.includes("enotfound") ||
    errorString.includes("getaddrinfo") ||
    errorString.includes("econnrefused") ||
    errorString.includes("econnreset") ||
    errorString.includes("network") ||
    errorString.includes("dns")
  ) {
    return {
      type: "network",
      status: 502,
      userMessage:
        "Cannot reach the feed server. Check the URL or try again later.",
      details: errorMessage,
    };
  }

  // 422 - Invalid feed structure
  if (
    errorString.includes("invalid rss") ||
    errorString.includes("missing required")
  ) {
    return {
      type: "invalid_feed",
      status: 422,
      userMessage: "The URL does not contain a valid RSS or Atom feed.",
      details: errorMessage,
    };
  }

  // 500 - Unknown errors
  return {
    type: "unknown",
    status: 500,
    userMessage: "Failed to fetch the RSS feed. Please try again.",
    details: errorMessage,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      {
        error: "URL parameter is required",
        errorType: "validation",
      },
      { status: 400 }
    );
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid URL format. Please provide a valid RSS feed URL.",
        errorType: "validation",
        url,
      },
      { status: 400 }
    );
  }

  // Function to attempt parsing with retries
  async function tryParseFeed(
    feedUrl: string,
    attempt: number = 1
  ): Promise<Parser.Output<unknown>> {
    try {
      return await parser.parseURL(feedUrl);
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt)
        );
        console.log(`Retry attempt ${attempt + 1} for ${feedUrl}`);
        return tryParseFeed(feedUrl, attempt + 1);
      }
      throw error;
    }
  }

  try {
    // First, try a HEAD request to check if URL exists (faster than full fetch)
    const headCheck = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RSSReader/1.0)",
      },
    }).catch(() => null);

    if (headCheck && headCheck.status === 404) {
      return NextResponse.json(
        {
          error:
            "Feed not found. The RSS feed URL may have changed or been removed.",
          errorType: "not_found",
          url,
        },
        { status: 404 }
      );
    }

    // Some feeds might block HEAD requests, so we proceed to parse anyway
    // Parse the RSS feed with retry logic
    let feed = await tryParseFeed(url);
    let usedUrl = url;

    // Validate that we got valid feed data
    if (!feed || (!feed.title && !feed.items?.length)) {
      // Attempt to find feed via discovery from HTML link tags or common suffix
      const discovered = await discoverFeedUrl(url);
      if (discovered && discovered !== url) {
        try {
          feed = await tryParseFeed(discovered);
          usedUrl = discovered;
          console.log(`Discovered feed ${discovered} for requested URL ${url}`);
        } catch {
          // ignore discovery failure and continue below to throw error
        }
      }

      if (!feed || (!feed.title && !feed.items?.length)) {
        throw new Error("Invalid RSS feed: No title or items found");
      }
    }

    // Additional validation: log warning for feeds with few items
    if (feed.items && feed.items.length < 3) {
      console.warn(`Feed ${url} returned only ${feed.items.length} items`);
    }

    const response = NextResponse.json({
      ...feed,
      _meta: {
        fetchedAt: new Date().toISOString(),
        itemCount: feed.items?.length || 0,
        source: parsedUrl.hostname,
        requestedUrl: url,
        usedUrl,
      },
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Cache-Control", "public, max-age=300"); // Cache for 5 minutes

    return response;
  } catch (error: unknown) {
    const feedError = classifyError(error);

    // Log with structured data for debugging
    console.error("RSS feed error:", {
      url,
      errorType: feedError.type,
      status: feedError.status,
      details: feedError.details,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: feedError.userMessage,
        errorType: feedError.type,
        details: feedError.details,
        url,
        suggestion: getSuggestion(feedError.type, url),
      },
      { status: feedError.status }
    );
  }
}

// Try to detect an RSS/Atom feed by inspecting HTML or trying common suffixes
async function discoverFeedUrl(inputUrl: string): Promise<string | null> {
  try {
    const res = await fetch(inputUrl, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RSSReader/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      // Not HTML, cannot discover
      return null;
    }

    const html = await res.text();

    // Look for <link rel="alternate" ... type="...rss..." href="..." />
    const linkRegex = /<link[^>]+rel=["']?alternate["']?[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html))) {
      const tag = match[0];
      // Extract href
      const hrefMatch = /href=["']([^"']+)["']/i.exec(tag);
      const typeMatch = /type=["']([^"']+)["']/i.exec(tag);
      if (hrefMatch) {
        const href = hrefMatch[1];
        const type = typeMatch ? typeMatch[1].toLowerCase() : "";
        if (
          type.includes("rss") ||
          type.includes("atom") ||
          href.toLowerCase().includes("rss") ||
          href.toLowerCase().includes("feed")
        ) {
          try {
            const discoveredUrl = new URL(href, inputUrl).href;
            return discoveredUrl;
          } catch (e) {
            continue;
          }
        }
      }
    }

    // If no explicit link found, try common suffixes
    const suffixes = ["/feed", "/rss", "/rss.xml", "/feed.xml", "/index.xml"];
    for (const suffix of suffixes) {
      try {
        const candidate = new URL(inputUrl).origin + suffix;
        const head = await fetch(candidate, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; RSSReader/1.0)" },
        }).catch(() => null);
        if (head && head.ok) return candidate;
      } catch {
        // ignore
      }
    }

    return null;
  } catch (err) {
    console.warn("Discovery failed:", err);
    return null;
  }
}

// Provide helpful suggestions based on error type
function getSuggestion(errorType: FeedErrorType, url: string): string {
  switch (errorType) {
    case "not_found":
      return "Try searching for the feed URL on the website or check if they have an alternative RSS endpoint.";
    case "invalid_xml":
      return "The feed may be temporarily broken. Try again later or contact the website.";
    case "timeout":
      return "The server is slow. Try again in a few minutes.";
    case "network":
      return "Check your internet connection or verify the URL is correct.";
    case "invalid_feed":
      return "This URL may not be an RSS feed. Look for a feed icon or /rss/ path on the website.";
    default:
      return "Try again later or verify the feed URL is correct.";
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
