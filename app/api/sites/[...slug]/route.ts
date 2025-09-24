import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, MetadataService } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // Reconstruct the URL from the slug
    const resolvedParams = await params;
    const slug = resolvedParams.slug.join('/');
    let targetUrl: string;

    try {
      // Handle both with and without protocol
      if (slug.startsWith('http')) {
        targetUrl = slug;
      } else {
        targetUrl = `https://${slug}`;
      }

      // Validate URL format
      new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Initialize database connection
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return NextResponse.json({ error: 'Database not available. Make sure Supabase is properly configured.' }, { status: 503 });
    }
    const metadataService = new MetadataService(supabase);

    // Get latest metadata for the site
    const siteData = await metadataService.getLatestMetadataByUrl(targetUrl);

    if (!siteData) {
      return NextResponse.json({ error: 'Site not found in database' }, { status: 404 });
    }

    let history;
    if (includeHistory && siteData.site) {
      const allVersions = await metadataService.getMetadataHistory(siteData.site.id);
      history = allVersions.filter((h) => !h.is_latest); // Exclude current version from history
    }

    const response = {
      success: true,
      data: {
        ...siteData,
        history,
      },
      url: targetUrl,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Site metadata API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
