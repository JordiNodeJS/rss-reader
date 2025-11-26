import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to check if a URL allows being embedded in an iframe.
 * Checks X-Frame-Options and Content-Security-Policy headers.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Invalid URL protocol" },
        { status: 400 }
      );
    }

    // Make a HEAD request to get headers without downloading the full page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    clearTimeout(timeoutId);

    // Check X-Frame-Options header
    const xFrameOptions = response.headers
      .get("x-frame-options")
      ?.toLowerCase();

    // Check Content-Security-Policy header for frame-ancestors
    const csp = response.headers.get("content-security-policy")?.toLowerCase();

    // Determine if iframe is blocked
    let blocked = false;
    let reason = "";

    if (xFrameOptions) {
      if (xFrameOptions === "deny") {
        blocked = true;
        reason = "X-Frame-Options: DENY";
      } else if (xFrameOptions === "sameorigin") {
        blocked = true;
        reason = "X-Frame-Options: SAMEORIGIN";
      }
    }

    // CSP frame-ancestors takes precedence over X-Frame-Options
    if (csp) {
      const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/);
      if (frameAncestorsMatch) {
        const value = frameAncestorsMatch[1].trim();
        if (value === "'none'") {
          blocked = true;
          reason = "CSP: frame-ancestors 'none'";
        } else if (value === "'self'" || !value.includes("*")) {
          // If it's 'self' or specific origins (not wildcards), it's likely blocked
          blocked = true;
          reason = `CSP: frame-ancestors ${value}`;
        }
      }
    }

    return NextResponse.json({
      url,
      blocked,
      reason: blocked ? reason : null,
      headers: {
        xFrameOptions: xFrameOptions || null,
        csp: csp ? csp.substring(0, 500) : null, // Limit CSP length
      },
    });
  } catch (error) {
    // If we can't check, assume it might work
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({
      url,
      blocked: false,
      reason: null,
      error: `Could not verify: ${errorMessage}`,
    });
  }
}
