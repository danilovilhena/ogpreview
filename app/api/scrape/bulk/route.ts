import { NextRequest, NextResponse } from 'next/server';
import { scrapingService, checkRateLimit, getRateLimitHeaders } from '@/lib/scraper';

export const runtime = 'nodejs';

interface BulkScrapeRequest {
  key: string;
  urls: string[];
  maxConcurrency?: number;
}

export async function POST(request: NextRequest) {
  // Check rate limit first
  const { allowed, remaining, resetTime } = checkRateLimit(request);
  const rateLimitHeaders = getRateLimitHeaders(remaining, resetTime);

  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429, headers: rateLimitHeaders });
  }

  try {
    const body: BulkScrapeRequest = await request.json();
    const { key, urls, maxConcurrency = 1 } = body;

    if (!key || !urls) {
      return NextResponse.json({ error: 'Missing key or urls in request body' }, { status: 400 });
    }

    if (key !== process.env.SCRAPE_SECRET) {
      return NextResponse.json({ error: 'Forbidden: Invalid authentication key' }, { status: 403 });
    }

    if (!Array.isArray(urls)) {
      return NextResponse.json({ error: 'urls must be an array' }, { status: 400 });
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: 'urls array cannot be empty' }, { status: 400 });
    }

    // Validate maxConcurrency
    const concurrency = Math.max(1, Math.min(maxConcurrency, 10)); // Limit between 1-10

    // Performance tracking
    const startTime = Date.now();

    // Scrape all URLs
    const results = await scrapingService.scrapeUrls(urls, concurrency);

    const totalTime = Date.now() - startTime;

    // Calculate statistics
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const saved = results.filter((r) => r.saved).length;

    const avgResponseTime =
      results.filter((r) => r.performance?.responseTime).reduce((sum, r) => sum + (r.performance?.responseTime || 0), 0) / successful || 0;

    const totalContentLength = results.filter((r) => r.performance?.contentLength).reduce((sum, r) => sum + (r.performance?.contentLength || 0), 0);

    return NextResponse.json(
      {
        success: true,
        totalUrls: urls.length,
        uniqueUrls: results.length,
        results,
        statistics: {
          successful,
          failed,
          saved,
          avgResponseTime: Math.round(avgResponseTime),
          totalContentLength,
          totalProcessingTime: totalTime,
          concurrency,
        },
      },
      { headers: rateLimitHeaders },
    );
  } catch (error: unknown) {
    console.error('Bulk scraping error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: rateLimitHeaders });
  }
}
