import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  }
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Fetch the RSS feed with error handling
    const feed = await parser.parseURL(url);
    
    // Validate that we got valid feed data
    if (!feed || !feed.title) {
      throw new Error('Invalid RSS feed: Missing required fields');
    }
    
    const response = NextResponse.json(feed);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Enhanced error logging
    console.error('Error parsing RSS feed:', {
      url,
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Provide more user-friendly error messages
    let userMessage = 'Failed to parse RSS feed';
    if (errorMessage.includes('Invalid XML') || errorMessage.includes('Attribute without value')) {
      userMessage = 'The RSS feed contains invalid XML. The feed may be malformed or temporarily unavailable.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      userMessage = 'Request timed out. The feed server may be slow or unavailable.';
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      userMessage = 'Feed URL not found. Please check the URL is correct.';
    } else if (errorMessage.includes('Invalid RSS feed')) {
      userMessage = errorMessage;
    }
    
    return NextResponse.json({ 
      error: userMessage,
      details: errorMessage,
      url 
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
