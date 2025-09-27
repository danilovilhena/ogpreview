import { getSupabaseClient } from '@/lib/db';
import { checkRateLimit } from '@/lib/scraper/check-rate-limit';
import { validateBody } from '@/lib/validateBody';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for request body
const requestSchema = z
  .object({
    siteId: z.string().uuid().optional(),
    slug: z.string().optional(),
  })
  .refine((data) => data.siteId || data.slug, {
    message: 'Either siteId or slug must be provided',
  });

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) return NextResponse.json({ ...rateLimit.error }, { ...rateLimit.errorBody });

  try {
    const { success, error, body, status } = await validateBody(requestSchema, request);
    if (!success || !body) return NextResponse.json({ error }, { status });

    const { siteId, slug } = body as z.infer<typeof requestSchema>;

    // Initialize database connection
    const supabaseResult = getSupabaseClient();
    if (!supabaseResult.success) {
      console.error('Database initialization failed:', supabaseResult.error);
      return NextResponse.json({ error: supabaseResult.error }, { status: supabaseResult.status });
    }
    const supabase = supabaseResult.supabase;

    // Find the site by ID or slug
    let siteQuery = supabase.from('sites').select('id, views, url, title');

    if (siteId) {
      siteQuery = siteQuery.eq('id', siteId);
    } else if (slug) {
      siteQuery = siteQuery.eq('slug', slug);
    }

    const { data: site, error: fetchError } = await siteQuery.single();

    if (fetchError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404, headers: rateLimit.headers });
    }

    // Increment views
    const { data: updatedSite, error: updateError } = await supabase
      .from('sites')
      .update({ views: site.views + 1 })
      .eq('id', site.id)
      .select('id, views, url, title')
      .single();

    if (updateError) {
      console.error('Failed to increment views:', updateError);
      return NextResponse.json({ error: 'Failed to increment views' }, { status: 500, headers: rateLimit.headers });
    }

    return NextResponse.json({ success: true, data: updatedSite, message: 'Views incremented successfully' }, { headers: rateLimit.headers });
  } catch (error: unknown) {
    console.error('Views increment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: rateLimit.headers });
  }
}
