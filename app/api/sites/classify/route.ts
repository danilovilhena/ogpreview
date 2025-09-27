import { classifySite } from '@/lib/classifier';
import { getExistingValues } from '@/lib/classifier/getExistingValues';
import { getSupabaseClient, MetadataService, SiteService } from '@/lib/db';
import { checkRateLimit } from '@/lib/scraper/check-rate-limit';
import { validateBody } from '@/lib/validateBody';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const DANGEROUS_OPERATION_SHOULD_SAVE = true;

const requestSchema = z.object({
  key: z.string(),
  count: z.number().optional().default(10), // Number of sites to classify, default 10
  all: z.boolean().optional().default(false), // If true, classify all unclassified sites
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) return NextResponse.json({ ...rateLimit.error }, { ...rateLimit.errorBody });

  try {
    const { success, error, body, status } = await validateBody(requestSchema, request);
    if (!success || !body) return NextResponse.json({ error }, { status });

    const { count, all } = body as z.infer<typeof requestSchema>;

    const supabaseResult = getSupabaseClient();
    if (!supabaseResult.success) return NextResponse.json({ error: supabaseResult.error }, { status: supabaseResult.status });
    const supabase = supabaseResult.supabase;

    const siteService = new SiteService(supabase);
    const metadataService = new MetadataService(supabase);

    const sitesQuery = supabase.from('sites').select(`*, domain:domains(*)`).eq('is_ai_classified', false);
    if (!all) sitesQuery.limit(count);
    const { data: sitesToClassify, error: fetchError } = await sitesQuery;

    if (fetchError) {
      throw new Error(`Failed to fetch sites: ${fetchError.message}`);
    }

    if (!sitesToClassify || sitesToClassify.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No sites need classification', processed: 0, successful: 0, failed: 0 },
        { headers: rateLimit.headers },
      );
    }

    const existingValues = await getExistingValues(supabase);
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < sitesToClassify.length; i += batchSize) {
      const batch = sitesToClassify.slice(i, i + batchSize);

      const batchPromises = batch.map(async (site) => {
        try {
          const metadata = await metadataService.getLatestMetadata(site.id);
          const classification = await classifySite(site, metadata, existingValues);
          if (DANGEROUS_OPERATION_SHOULD_SAVE) await siteService.updateSiteClassification(site.id, classification, true);
          return { success: true, siteId: site.id, url: site.url, classification };
        } catch (error) {
          console.error(`Failed to classify site ${site.id}:`, error);
          return { success: false, siteId: site.id, url: site.url, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map((r) => (r.status === 'fulfilled' ? r.value : r.reason)));

      if (i + batchSize < sitesToClassify.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ success: true, processed: sitesToClassify.length, successful, failed, details: results }, { headers: rateLimit.headers });
  } catch (error: unknown) {
    console.error('AI classification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: rateLimit.headers });
  }
}
