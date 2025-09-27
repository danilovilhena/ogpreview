import { scrapeUrls } from '@/lib/scraper';
import { checkRateLimit } from '@/lib/scraper/check-rate-limit';
import { validateBody } from '@/lib/validateBody';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestSchema = z.object({
  key: z.string(),
  urls: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) return NextResponse.json({ ...rateLimit.error }, { ...rateLimit.errorBody });

  try {
    const { success, error, body, status } = await validateBody(requestSchema, request);
    if (!success) return NextResponse.json({ error }, { status });

    const { urls } = body as z.infer<typeof requestSchema>;

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
