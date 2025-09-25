import { NextResponse } from 'next/server';
import { getSupabase, SiteService } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  try {
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return NextResponse.json({ error: 'Database not available. Make sure Supabase is properly configured.' }, { status: 503 });
    }

    const siteService = new SiteService(supabase);
    const filters = await siteService.getFilterStats();
    return NextResponse.json({ success: true, filters });
  } catch (error: unknown) {
    console.error('Filters API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Usage Examples:
 *
 * GET /api/sites/filters
 * Returns all available filters with counts from the database
 *
 * Use with /api/sites endpoint:
 * - Basic filter: /api/sites?industry=Technology&country=US
 * - Multiple filters: /api/sites?industry=Technology&companySize=Medium (51-200)
 * - With confidence: /api/sites?confidenceMin=0.8&isAiClassified=true
 * - Search with filters: /api/sites?search=api&industry=Technology
 * - Pagination: /api/sites?limit=25&offset=50
 *
 * Supported parameters:
 * industry, category, country, language, companySize, isVerified,
 * isAiClassified, confidenceMin, search, limit, offset, includeHistory
 */
