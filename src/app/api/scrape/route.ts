import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import DOMPurify from 'isomorphic-dompurify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // Block unnecessary resources to improve performance
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}', route => route.abort());

    // Navigate to the URL with better error handling
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (navError) {
      const errorMsg = navError instanceof Error ? navError.message : 'Navigation failed';
      console.error('Navigation error:', { url, error: errorMsg });
      throw new Error(`Failed to load page: ${errorMsg}`);
    }

    // Get the HTML content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Basic heuristic to find article content
    let content = '';
    
    // Try to find the main article content
    const selectors = [
        'article',
        '[role="main"]',
        '.article-body',
        '.content',
        '.post-content',
        '.entry-content',
        'main'
    ];

    for (const selector of selectors) {
        const element = $(selector);
        if (element.length > 0) {
            // Remove unwanted elements
            element.find('script, style, nav, header, footer, .ad, .advertisement, .social-share, iframe, noscript').remove();
            content = element.html() || '';
            if (content.length > 500) break; // Found substantial content
        }
    }

    // Fallback to body if nothing found
    if (!content) {
        const body = $('body');
        body.find('script, style, nav, header, footer, iframe, noscript').remove();
        content = body.html() || '';
    }

    // Check if we actually got content
    if (!content || content.trim().length < 100) {
      throw new Error('No substantial content found on the page');
    }

    // Sanitize HTML but preserve formatting tags
    const cleanContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
        'div', 'span', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 
        'tr', 'th', 'td', 'hr', 'del', 'ins', 'sup', 'sub'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
      ALLOW_DATA_ATTR: false,
    });

    return NextResponse.json({ content: cleanContent });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error scraping URL:', {
      url,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Failed to scrape URL',
      details: errorMessage,
      url 
    }, { status: 500 });
  } finally {
    if (browser) {
        await browser.close();
    }
  }
}


