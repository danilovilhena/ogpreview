import { scrapeUrl } from '@/lib/scraper';
import { checkRateLimit } from '@/lib/scraper/check-rate-limit';
import { validateBody } from '@/lib/validateBody';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestSchema = z.object({
  key: z.string(),
  url: z.string(),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) return NextResponse.json({ ...rateLimit.error }, { ...rateLimit.errorBody });

  try {
    const { success, error, body, status } = await validateBody(requestSchema, request);
    if (!success) return NextResponse.json({ error }, { status });

    const { url } = body as z.infer<typeof requestSchema>;

    const result = await scrapeUrl(url);
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
