import { NextRequest, NextResponse } from 'next/server';
import { scrapingService, checkRateLimit, getRateLimitHeaders } from '@/lib/scraper';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Check rate limit first
  const { allowed, remaining, resetTime } = checkRateLimit(request);
  const rateLimitHeaders = getRateLimitHeaders(remaining, resetTime);

  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429, headers: rateLimitHeaders });
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

    // Use the scraping service to handle the URL
    const result = await scrapingService.scrapeUrl(url);

    if (!result.success) {
      const status = result.error === 'Invalid URL format' ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status, headers: rateLimitHeaders });
    }

    return NextResponse.json(
      {
        success: result.success,
        url: result.url,
        metadata: result.metadata,
        scrapedAt: result.scrapedAt,
        saved: result.saved,
        performance: result.performance,
      },
      { headers: rateLimitHeaders },
    );
  } catch (error: unknown) {
    console.error('Scraping error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: rateLimitHeaders });
  }
}
