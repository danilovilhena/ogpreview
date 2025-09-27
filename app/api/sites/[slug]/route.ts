import { getSupabaseClient, MetadataService } from '@/lib/db';
import type { SiteMetadataWithSite } from '@/lib/db/types';
import { safeJsonParse } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSiteMetadataBySlug = async (slug: string, supabase: any): Promise<SiteMetadataWithSite | null> => {
  const { data: site, error: siteError } = await supabase.from('sites').select('*, domain:domains(*)').eq('slug', slug).single();

  if (siteError || !site) {
    return null;
  }

  const { data: metadata, error: metadataError } = await supabase.from('site_metadata').select('*').eq('site_id', site.id).eq('is_latest', true).single();

  if (metadataError || !metadata) {
    return null;
  }

  const parsed = { ...metadata };
  if (parsed.basic_metadata) {
    parsed.basic = safeJsonParse(parsed.basic_metadata as string);
    parsed.basic_metadata = undefined;
  }
  if (parsed.open_graph_metadata) {
    parsed.openGraph = safeJsonParse(parsed.open_graph_metadata as string);
    parsed.open_graph_metadata = undefined;
  }
  if (parsed.twitter_metadata) {
    parsed.twitter = safeJsonParse(parsed.twitter_metadata as string);
    parsed.twitter_metadata = undefined;
  }
  if (parsed.ld_json_metadata) {
    parsed.jsonLd = safeJsonParse(parsed.ld_json_metadata as string);
    parsed.ld_json_metadata = undefined;
  }
  if (parsed.raw_metadata) {
    parsed.raw = safeJsonParse(parsed.raw_metadata as string);
    parsed.raw_metadata = undefined;
  }

  return { ...parsed, site } as SiteMetadataWithSite;
};

const addHistoryToSiteMetadata = async (siteMetadata: SiteMetadataWithSite, metadataService: MetadataService) => {
  if (siteMetadata?.site) {
    const history = await metadataService.getMetadataHistory(siteMetadata.site.id);
    return {
      ...siteMetadata,
      history: history.filter((h) => !h.is_latest), // Exclude current version from history
    };
  }
  return siteMetadata;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const supabaseResult = getSupabaseClient();
    if (!supabaseResult.success) {
      console.error('Database initialization failed:', supabaseResult.error);
      return NextResponse.json({ error: supabaseResult.error }, { status: supabaseResult.status });
    }
    const supabase = supabaseResult.supabase;

    const metadataService = new MetadataService(supabase);

    // Get site metadata by slug
    let siteMetadata = await getSiteMetadataBySlug(slug, supabase);

    if (!siteMetadata) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Add version history if requested
    if (includeHistory) {
      siteMetadata = await addHistoryToSiteMetadata(siteMetadata, metadataService);
    }

    const response = {
      success: true,
      data: siteMetadata,
      slug,
      includeHistory,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Site by slug API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
