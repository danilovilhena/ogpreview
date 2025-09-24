import { NextRequest, NextResponse } from 'next/server';
import { extractMetadata, guardedFetchHtml, handleScrapingError, checkRateLimit, getRateLimitHeaders } from '@/lib/scraper';
import { getSupabase, SiteService, MetadataService } from '@/lib/db';

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

    let targetUrl: URL;
    try {
      targetUrl = new URL(url?.includes('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Performance tracking
    const startTime = Date.now();

    const html = await guardedFetchHtml(targetUrl);

    const responseTime = Date.now() - startTime;
    const metadata = extractMetadata(html, targetUrl);
    const scrapedAt = new Date().toISOString();

    // Save to database
    let saved = false;
    try {
      const supabase = getSupabase();
      const siteService = new SiteService(supabase);
      const metadataService = new MetadataService(supabase);

      // Get or create domain and site
      const domain = await siteService.upsertDomain(targetUrl.hostname);
      const site = await siteService.upsertSite(targetUrl.toString(), domain.id);

      // Save metadata with performance info
      await metadataService.saveMetadata(site.id, metadata, scrapedAt, {
        responseTime,
        contentLength: html.length,
        httpStatus: 200, // Assuming success since we got here
      });

      saved = true;
    } catch (dbError) {
      console.error('Failed to save to database:', dbError);
      // Continue without failing the request
    }

    return NextResponse.json(
      {
        success: true,
        url: targetUrl.toString(),
        metadata,
        scrapedAt,
        saved,
        performance: {
          responseTime,
          contentLength: html.length,
        },
      },
      { headers: rateLimitHeaders },
    );
  } catch (error: unknown) {
    console.error('Scraping error:', error);

    const { error: errorMessage, status } = handleScrapingError(error);
    return NextResponse.json({ error: errorMessage }, { status, headers: rateLimitHeaders });
  }
}
