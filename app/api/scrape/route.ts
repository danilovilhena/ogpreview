import { checkRateLimit } from '@/lib/scraper/check-rate-limit';
import { scrapeUrl } from '@/lib/scraper';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateBody = async (request: NextRequest): Promise<{ success: boolean; error?: string; body?: any; status?: number }> => {
  let body;

  try {
    body = await request.json();
  } catch {
    return { success: false, error: 'Invalid request body', status: 400 };
  }

  if (!body?.key || !body?.url) {
    return { success: false, error: 'Missing key or url in request body', status: 400 };
  }
  if (body.key !== process.env.SCRAPE_SECRET) {
    return { success: false, error: 'Forbidden: Invalid authentication key', status: 403 };
  }
  return { success: true, body };
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) return NextResponse.json({ ...rateLimit.error }, { ...rateLimit.errorBody });

  try {
    const { success, error, body, status } = await validateBody(request);
    if (!success) return NextResponse.json({ error }, { status });

    const result = await scrapeUrl(body?.url);
    if (!result.success) {
      const status = result.error === 'Invalid URL format' ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status, headers: rateLimit.headers });
    }

    return NextResponse.json(
      {
        success: result.success,
        url: result.url,
        metadata: result.metadata,
        scrapedAt: result.scrapedAt,
        saved: result.saved,
        performance: result.performance,
        info: result.info,
      },
      { headers: rateLimit.headers },
    );
  } catch (error: unknown) {
    console.error('Scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: rateLimit.headers });
  }
}
