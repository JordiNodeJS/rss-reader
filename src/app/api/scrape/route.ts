import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

// Fetch HTML from URL with browser-like headers
async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      Referer: new URL(url).origin,
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

// Extract article content using Mozilla Readability (same algorithm as Firefox Reader View)
function extractWithReadability(html: string, url: string): string | null {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article?.content && article.content.length > 200) {
      return article.content;
    }
    return null;
  } catch (error) {
    console.warn("Readability extraction failed:", error);
    return null;
  }
}

// Fallback: Extract article content from HTML using Cheerio with site-specific selectors
function extractWithCheerio(html: string, url: string): string {
  const $ = cheerio.load(html);

  let content = "";

  // Site-specific selectors for Spanish news sites
  const hostname = new URL(url).hostname;
  let selectors: string[] = [];

  if (hostname.includes("eldiario.es")) {
    selectors = [
      ".article-page__body-row",
      ".article-content",
      "[itemprop='articleBody']",
      "article.article-page",
      ".article-body",
    ];
  } else if (hostname.includes("publico.es")) {
    selectors = [
      ".article-text",
      ".article__body",
      "[itemprop='articleBody']",
      ".story-body",
      "article",
    ];
  } else if (hostname.includes("infolibre.es")) {
    selectors = [
      ".article-body",
      ".article__content",
      "[itemprop='articleBody']",
      ".body-content",
      "article",
    ];
  } else if (hostname.includes("lamarea.com")) {
    selectors = [
      ".entry-content",
      ".post-content",
      ".article-content",
      "article .content",
      "article",
    ];
  } else if (hostname.includes("elsaltodiario.com")) {
    selectors = [
      ".article-content",
      ".post-content",
      ".entry-content",
      "[itemprop='articleBody']",
      "article",
    ];
  } else if (hostname.includes("ctxt.es")) {
    selectors = [
      ".article-body",
      ".article-content",
      ".post-content",
      ".entry-content",
      "article",
    ];
  } else if (hostname.includes("newtral.es")) {
    selectors = [
      ".article-content",
      ".post-content",
      ".entry-content",
      "[itemprop='articleBody']",
      "article",
    ];
  } else if (hostname.includes("cuartopoder.es")) {
    selectors = [
      ".entry-content",
      ".post-content",
      ".article-content",
      "article .content",
      "article",
    ];
  } else if (hostname.includes("kaosenlared.net")) {
    selectors = [
      ".entry-content",
      ".post-content",
      ".article-content",
      "article .content",
      "article",
    ];
  } else if (hostname.includes("nuevatribuna.es")) {
    selectors = [
      ".article-body",
      ".article-content",
      "[itemprop='articleBody']",
      ".story-body",
      "article",
    ];
  } else if (hostname.includes("lavanguardia.com")) {
    selectors = [
      ".article-modules",
      ".article-body",
      "[itemprop='articleBody']",
      ".story-body__inner",
      "article",
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
          "script, style, nav, header, footer, .ad, .advertisement, .social-share, iframe, noscript, .item__content__image, .related-posts, .comments, .sidebar, .newsletter, .subscription, .paywall"
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
              Referer: baseUrl,
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
    console.log(`Scraping with fetch + Readability: ${url}`);

    // Fetch HTML
    const html = await fetchHtml(url);

    // Try Readability first (best article extraction), fall back to Cheerio
    let content = extractWithReadability(html, url);
    const method = content ? "readability" : "cheerio";

    if (!content) {
      console.log("Readability failed, using Cheerio fallback");
      content = extractWithCheerio(html, url);
    }

    // Check if we actually got content
    if (!content || content.trim().length < 100) {
      throw new Error(
        "No substantial content found on the page. The site may require JavaScript rendering or may be blocking automated requests."
      );
    }

    // Process and optimize images
    content = await processImages(content, url);

    // Sanitize HTML
    const cleanContent = sanitizeContent(content);

    return NextResponse.json({
      content: cleanContent,
      method,
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
        hint: "This scraper uses fetch + Readability. Some JavaScript-heavy sites or sites with anti-bot protection may not work correctly.",
      },
      { status: 500 }
    );
  }
}
