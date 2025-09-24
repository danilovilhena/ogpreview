import { NextRequest, NextResponse } from 'next/server';
import { extractMetadata, guardedFetchHtml, handleScrapingError, checkRateLimit, getRateLimitHeaders } from '@/lib/scraper';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Check rate limit first
  const { allowed, remaining, resetTime } = checkRateLimit(request);
  const rateLimitHeaders = getRateLimitHeaders(remaining, resetTime);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: rateLimitHeaders,
      },
    );
  }

  try {
    const body = await request.json();
    const key = body?.key;
    const url = body?.url;

    if (!key || !url) {
      return NextResponse.json({ error: 'Missing key or url in request body' }, { status: 400 });
    }
    if (key !== process.env.SCRAPE_SECRET) {
      return NextResponse.json({ error: 'Forbidden: Invalid authentication key' }, { status: 403 });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url?.includes('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const html = await guardedFetchHtml(targetUrl);

    const metadata = extractMetadata(html, targetUrl);

    return NextResponse.json(
      {
        success: true,
        url: targetUrl.toString(),
        metadata,
        scrapedAt: new Date().toISOString(),
      },
      {
        headers: rateLimitHeaders,
      },
    );
  } catch (error: unknown) {
    console.error('Scraping error:', error);

    const { error: errorMessage, status } = handleScrapingError(error);
    return NextResponse.json(
      { error: errorMessage },
      {
        status,
        headers: rateLimitHeaders,
      },
    );
  }
}
