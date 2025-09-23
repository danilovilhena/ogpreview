import { NextRequest, NextResponse } from 'next/server';
import ky from 'ky';
import { extractMetadata } from '@/lib/scraper';

export async function POST(request: NextRequest) {
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

    const html = await ky
      .get(targetUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OGPreview/1.0; +https://ogpreview.co)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
        timeout: 30000,
      })
      .text();

    const metadata = extractMetadata(html, targetUrl);

    return NextResponse.json({
      success: true,
      url: targetUrl.toString(),
      metadata,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scraping error:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const kyError = error as { response?: { status?: number; statusText?: string } };
      return NextResponse.json(
        { error: `Failed to fetch URL: ${kyError.response?.status || 'Unknown'} ${kyError.response?.statusText || ''}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Internal server error during scraping' }, { status: 500 });
  }
}
