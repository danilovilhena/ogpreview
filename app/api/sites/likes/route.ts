import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/db';
import { checkRateLimit } from '@/lib/scraper/check-rate-limit';
import { validateBody } from '@/lib/validateBody';

// Validation schema for request body
const requestSchema = z
  .object({
    siteId: z.string().uuid().optional(),
    slug: z.string().optional(),
    increment: z.boolean().default(true),
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

    const { siteId, slug, increment } = body as z.infer<typeof requestSchema>;

    // Initialize database connection
    const supabaseResult = getSupabaseClient();
    if (!supabaseResult.success) {
      console.error('Database initialization failed:', supabaseResult.error);
      return NextResponse.json({ error: supabaseResult.error }, { status: supabaseResult.status });
    }
    const supabase = supabaseResult.supabase;

    // Find the site by ID or slug
    let siteQuery = supabase.from('sites').select('id, likes, url, title');

    if (siteId) {
      siteQuery = siteQuery.eq('id', siteId);
    } else if (slug) {
      siteQuery = siteQuery.eq('slug', slug);
    }

    const { data: site, error: fetchError } = await siteQuery.single();

    if (fetchError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404, headers: rateLimit.headers });
    }

    // Update likes (increment or decrement)
    const newLikesCount = increment ? site.likes + 1 : site.likes - 1;
    const { data: updatedSite, error: updateError } = await supabase
      .from('sites')
      .update({ likes: newLikesCount })
      .eq('id', site.id)
      .select('id, likes, url, title')
      .single();

    if (updateError) {
      console.error('Failed to update likes:', updateError);
      return NextResponse.json({ error: 'Failed to update likes' }, { status: 500, headers: rateLimit.headers });
    }

    return NextResponse.json(
      { success: true, data: updatedSite, message: `Likes ${increment ? 'incremented' : 'decremented'} successfully` },
      { headers: rateLimit.headers },
    );
  } catch (error: unknown) {
    console.error('Likes update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: rateLimit.headers });
  }
}
