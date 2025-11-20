import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

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

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

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
            element.find('script, style, nav, header, footer, .ad, .advertisement, .social-share').remove();
            content = element.html() || '';
            if (content.length > 500) break; // Found substantial content
        }
    }

    // Fallback to body if nothing found
    if (!content) {
        const body = $('body');
        body.find('script, style, nav, header, footer').remove();
        content = body.html() || '';
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error scraping URL:', error);
    return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
  } finally {
    if (browser) {
        await browser.close();
    }
  }
}
