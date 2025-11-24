import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";

// Check if Playwright is available (won't work on Vercel serverless)
let playwrightAvailable = false;
let chromium: typeof import("playwright").chromium | null = null;

async function checkPlaywright() {
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
    // Try to actually launch to verify it works
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    playwrightAvailable = true;
    console.log("Playwright is available and working");
  } catch {
    playwrightAvailable = false;
    chromium = null;
    console.log("Playwright not available, using fetch fallback");
  }
}

// Check on module load
const playwrightCheck = checkPlaywright();

// Fetch-based scraping fallback (works on Vercel)
async function scrapeWithFetch(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

// Playwright-based scraping (for local dev or platforms that support it)
async function scrapeWithPlaywright(url: string): Promise<string> {
  if (!chromium) throw new Error("Playwright not available");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Block CSS and fonts to improve performance, but allow images
    await page.route("**/*.{css,woff,woff2}", (route) => route.abort());

    // Block ads and tracking scripts
    await page.route("**/*", (route) => {
      const reqUrl = route.request().url();
      if (
        reqUrl.includes("doubleclick") ||
        reqUrl.includes("google-analytics") ||
        reqUrl.includes("googletagmanager") ||
        reqUrl.includes("facebook.com/tr") ||
        reqUrl.includes("/ads/")
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}

// Extract article content from HTML
function extractContent(html: string, url: string): string {
  const $ = cheerio.load(html);

  // Basic heuristic to find article content
  let content = "";

  // Try to find the main article content with site-specific selectors
  const hostname = new URL(url).hostname;
  let selectors: string[] = [];

  if (hostname.includes("eldiario.es")) {
    // Specific selectors for eldiario.es
    selectors = [
      ".article-page__body-row",
      ".article-content",
      "[itemprop='articleBody']",
      "article.article-page",
      ".article-body",
    ];
  } else if (hostname.includes("medium.com")) {
    selectors = ["article", ".postArticle-content", "section"];
  } else if (hostname.includes("dev.to")) {
    selectors = ["#article-body", ".crayons-article__body"];
  } else if (hostname.includes("github.com")) {
    selectors = [".markdown-body", ".readme"];
  } else {
    // Generic selectors for other sites
    selectors = [
      "article",
      '[role="main"]',
      ".article-body",
      ".article-content",
      ".post-content",
      ".entry-content",
      ".content",
      "main",
      "#content",
    ];
  }

  for (const selector of selectors) {
    const element = $(selector);
    if (element.length > 0) {
      // Remove unwanted elements
      element
        .find(
          "script, style, nav, header, footer, .ad, .advertisement, .social-share, iframe, noscript, .item__content__image, .related-posts, .comments, .sidebar"
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
      .find(
        "script, style, nav, header, footer, iframe, noscript, .sidebar, .comments"
      )
      .remove();
    content = body.html() || "";
  }

  return content;
}

// Process and optimize images
async function processImages(
  content: string,
  baseUrl: string
): Promise<string> {
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
      const base = new URL(baseUrl);
      absoluteUrl = new URL(imgUrl, base.origin).href;
    }

    imagePromises.push(
      (async () => {
        try {
          const imgResponse = await fetch(absoluteUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            signal: AbortSignal.timeout(10000),
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

  return content;
}

// Sanitize HTML content
function sanitizeContent(content: string): string {
  return sanitizeHtml(content, {
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
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Wait for Playwright check to complete
    await playwrightCheck;

    let html: string;

    // Try Playwright first if available, otherwise use fetch
    if (playwrightAvailable && chromium) {
      try {
        console.log(`Scraping with Playwright: ${url}`);
        html = await scrapeWithPlaywright(url);
      } catch (pwError) {
        console.warn("Playwright failed, falling back to fetch:", pwError);
        html = await scrapeWithFetch(url);
      }
    } else {
      console.log(`Scraping with fetch (Playwright not available): ${url}`);
      html = await scrapeWithFetch(url);
    }

    // Extract article content
    let content = extractContent(html, url);

    // Check if we actually got content
    if (!content || content.trim().length < 100) {
      throw new Error(
        "No substantial content found on the page. The site may require JavaScript rendering which is not available in this environment."
      );
    }

    // Process and optimize images
    content = await processImages(content, url);

    // Sanitize HTML
    const cleanContent = sanitizeContent(content);

    return NextResponse.json({
      content: cleanContent,
      method: playwrightAvailable ? "playwright" : "fetch",
    });
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
        hint: playwrightAvailable
          ? undefined
          : "Running in fetch-only mode. Some JavaScript-heavy sites may not work correctly.",
      },
      { status: 500 }
    );
  }
}
