import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, SiteService } from '@/lib/db';
import type { SiteUpdate } from '@/lib/db/types';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, classification, isAiGenerated = false, apiKey } = body;

    // Authentication check
    if (!apiKey || apiKey !== process.env.SCRAPE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!siteId || !classification) {
      return NextResponse.json({ error: 'Missing siteId or classification data' }, { status: 400 });
    }

    // Initialize database connection
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return NextResponse.json({ error: 'Database not available. Make sure Supabase is properly configured.' }, { status: 503 });
    }
    const siteService = new SiteService(supabase);

    // Update site classification
    const updatedSite = await siteService.updateSiteClassification(siteId, classification, isAiGenerated);

    if (!updatedSite || updatedSite.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedSite[0],
      message: `Site classification updated ${isAiGenerated ? 'by AI' : 'manually'}`,
    });
  } catch (error: unknown) {
    console.error('Site classification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sites, apiKey } = body;

    // Authentication check
    if (!apiKey || apiKey !== process.env.SCRAPE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sites || !Array.isArray(sites)) {
      return NextResponse.json({ error: 'Missing sites array' }, { status: 400 });
    }

    // Initialize database connection
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return NextResponse.json({ error: 'Database not available. Make sure Supabase is properly configured.' }, { status: 503 });
    }
    const siteService = new SiteService(supabase);

    // Batch update sites
    const results = await Promise.allSettled(
      sites.map(async (site: { siteId: string; classification: Partial<SiteUpdate>; isAiGenerated?: boolean }) => {
        const { siteId, classification, isAiGenerated = true } = site;
        return siteService.updateSiteClassification(siteId, classification, isAiGenerated);
      }),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      processed: sites.length,
      successful,
      failed,
      message: `Batch classification completed: ${successful} successful, ${failed} failed`,
    });
  } catch (error: unknown) {
    console.error('Batch site classification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
