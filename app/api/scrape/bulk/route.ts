import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrls } from '@/lib/scraper';
import { checkRateLimit } from '@/lib/scraper/check-rate-limit';

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateBody = async (request: NextRequest): Promise<{ success: boolean; error?: string; body?: any; status?: number }> => {
  let body;

  try {
    body = await request.json();
  } catch {
    return { success: false, error: 'Invalid request body', status: 400 };
  }

  if (!body?.key || !body?.urls) {
    return { success: false, error: 'Missing key or url in request body', status: 400 };
  }

  if (body.key !== process.env.SCRAPE_SECRET) {
    return { success: false, error: 'Forbidden: Invalid authentication key', status: 403 };
  }

  if (!Array.isArray(body.urls)) {
    return { success: false, error: 'urls must be an array', status: 400 };
  }

  if (body.urls.length === 0) {
    return { success: false, error: 'urls array cannot be empty', status: 400 };
  }

  return { success: true, body };
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) return NextResponse.json({ ...rateLimit.error }, { ...rateLimit.errorBody });

  try {
    const { success, error, body, status } = await validateBody(request);
    if (!success) return NextResponse.json({ error }, { status });

    const urls = body?.urls;
    const startTime = Date.now();
    const results = await scrapeUrls(urls, 1);
    const totalProcessingTime = Date.now() - startTime;

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const saved = results.filter((r) => r.saved).length;

    return NextResponse.json(
      {
        success: true,
        totalUrls: urls.length,
        uniqueUrls: results.length,
        results,
        statistics: { successful, failed, saved, totalProcessingTime },
      },
      { headers: rateLimit.headers },
    );
  } catch (error: unknown) {
    console.error('Bulk scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: rateLimit.headers });
  }
}
