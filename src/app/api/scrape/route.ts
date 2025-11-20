import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  let browser;
  try {
    // Launch browser with error handling
    try {
      browser = await chromium.launch({ headless: true });
    } catch (launchError) {
      const errorMsg =
        launchError instanceof Error
          ? launchError.message
          : "Failed to launch browser";
      console.error("Browser launch error:", errorMsg);
      return NextResponse.json(
        {
          error: "Browser initialization failed",
          details:
            "Playwright browsers may not be installed. Run: npx playwright install chromium",
        },
        { status: 500 }
      );
    }

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Block CSS and fonts to improve performance, but allow images
    await page.route("**/*.{css,woff,woff2}", (route) => route.abort());

    // Block ads and tracking scripts
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (
        url.includes("doubleclick") ||
        url.includes("google-analytics") ||
        url.includes("googletagmanager") ||
        url.includes("facebook.com/tr") ||
        url.includes("/ads/")
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Navigate to the URL with better error handling
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (navError) {
      const errorMsg =
        navError instanceof Error ? navError.message : "Navigation failed";
      console.error("Navigation error:", { url, error: errorMsg });
      throw new Error(`Failed to load page: ${errorMsg}`);
    }

    // Get the HTML content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Basic heuristic to find article content
    let content = "";

    // Try to find the main article content
    const selectors = [
      "article",
      '[role="main"]',
      ".article-body",
      ".content",
      ".post-content",
      ".entry-content",
      "main",
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Remove unwanted elements
        element
          .find(
            "script, style, nav, header, footer, .ad, .advertisement, .social-share, iframe, noscript"
          )
          .remove();
        content = element.html() || "";
        if (content.length > 500) break; // Found substantial content
      }
    }

    // Fallback to body if nothing found
    if (!content) {
      const body = $("body");
      body
        .find("script, style, nav, header, footer, iframe, noscript")
        .remove();
      content = body.html() || "";
    }

    // Check if we actually got content
    if (!content || content.trim().length < 100) {
      throw new Error("No substantial content found on the page");
    }

    // Optimize images: download and convert to WebP
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    const imagePromises: Promise<void>[] = [];
    const imageMap = new Map<string, string>();

    while ((match = imgRegex.exec(content)) !== null) {
      const imgUrl = match[1];

      // Skip data URLs and already optimized images
      if (imgUrl.startsWith("data:") || imgUrl.includes(".webp")) {
        continue;
      }

      // Resolve relative URLs
      let absoluteUrl = imgUrl;
      if (!imgUrl.startsWith("http")) {
        const baseUrl = new URL(url);
        absoluteUrl = new URL(imgUrl, baseUrl.origin).href;
      }

      imagePromises.push(
        (async () => {
          try {
            const imgResponse = await fetch(absoluteUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (!imgResponse.ok) return;

            const arrayBuffer = await imgResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Optimize and convert to WebP
            const optimized = await sharp(buffer)
              .resize(1200, 1200, {
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 80 })
              .toBuffer();

            // Convert to base64 data URL
            const base64 = optimized.toString("base64");
            const dataUrl = `data:image/webp;base64,${base64}`;

            imageMap.set(imgUrl, dataUrl);
          } catch (error) {
            console.warn(`Failed to optimize image: ${absoluteUrl}`, error);
            // Keep original URL if optimization fails
          }
        })()
      );
    }

    // Wait for all images to be processed
    await Promise.all(imagePromises);

    // Replace image URLs in content with optimized versions
    imageMap.forEach((dataUrl, originalUrl) => {
      content = content.replace(
        new RegExp(originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        dataUrl
      );
    });

    // Sanitize HTML but preserve formatting tags
    const cleanContent = sanitizeHtml(content, {
      allowedTags: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "a",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "code",
        "pre",
        "div",
        "span",
        "img",
        "figure",
        "figcaption",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "hr",
        "del",
        "ins",
        "sup",
        "sub",
      ],
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt", "title"],
        "*": ["class"],
      },
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: {
        img: ["http", "https", "data"],
      },
    });

    return NextResponse.json({ content: cleanContent });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error scraping URL:", {
      url,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to scrape URL",
        details: errorMessage,
        url,
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
