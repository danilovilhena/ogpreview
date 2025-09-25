import { getSupabase, MetadataService, SiteService } from '@/lib/db';
import type { SiteFilters } from '@/lib/db/services/site-service';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

function parseFiltersFromSearchParams(searchParams: URLSearchParams): SiteFilters {
  const filters: SiteFilters = {};

  if (searchParams.get('industry')) filters.industry = searchParams.get('industry')!;
  if (searchParams.get('category')) filters.category = searchParams.get('category')!;
  if (searchParams.get('country')) filters.country = searchParams.get('country')!;
  if (searchParams.get('language')) filters.language = searchParams.get('language')!;
  if (searchParams.get('companySize')) filters.companySize = searchParams.get('companySize')!;

  if (searchParams.get('isVerified')) filters.isVerified = searchParams.get('isVerified') === 'true';
  if (searchParams.get('isAiClassified')) filters.isAiClassified = searchParams.get('isAiClassified') === 'true';
  if (searchParams.get('confidenceMin')) filters.confidenceMin = parseFloat(searchParams.get('confidenceMin')!);

  const search = searchParams.get('search');
  if (search) filters.searchTerm = search;

  return filters;
}

async function getSitesForDomain(domain: string, siteService: SiteService, metadataService: MetadataService) {
  const sitesWithDomains = await siteService.getSitesByDomain(domain);

  return Promise.all(
    sitesWithDomains.map(async (siteWithDomain) => {
      const metadata = await metadataService.getLatestMetadata(siteWithDomain.id);
      return {
        metadata,
        site: siteWithDomain,
        domain: siteWithDomain.domain,
      };
    }),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addHistoryToSites(sites: any[], metadataService: MetadataService) {
  return Promise.all(
    sites.map(async (siteData) => {
      if (siteData.site) {
        const history = await metadataService.getMetadataHistory(siteData.site.id);
        return {
          ...siteData,
          history: history.filter((h) => !h.is_latest), // Exclude current version from history
        };
      }
      return siteData;
    }),
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const limit = parseInt(searchParams.get('limit') || '60');
    const offset = parseInt(searchParams.get('offset') || '0');
    const getStats = searchParams.get('stats') === 'true';

    const filters = parseFiltersFromSearchParams(searchParams);

    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return NextResponse.json({ error: 'Database not available. Make sure Supabase is properly configured.' }, { status: 503 });
    }

    const siteService = new SiteService(supabase);
    const metadataService = new MetadataService(supabase);

    let sites;
    let stats;
    let filterStats;
    let totalCount = 0;

    if (domain) {
      // Legacy: Get sites for a specific domain
      sites = await getSitesForDomain(domain, siteService, metadataService);
      totalCount = sites.length; // For domain-specific queries, use actual count
    } else {
      // Get the total count for pagination
      totalCount = await metadataService.getFilteredSitesCount(filters);

      // Always use the same method for consistency
      sites = await metadataService.getFilteredSitesWithMetadata(filters, limit, offset);

      // Only get stats if no filters are applied (for performance)
      if (Object.keys(filters).length === 0) {
        stats = await metadataService.getMetadataStats();
      }
    }

    // Get filter statistics if requested
    if (getStats) {
      filterStats = await siteService.getFilterStats();
    }

    // Add version history if requested
    if (includeHistory && sites.length > 0) {
      sites = await addHistoryToSites(sites, metadataService);
    }

    const response = {
      success: true,
      data: sites,
      stats,
      filterStats,
      appliedFilters: filters,
      pagination: { total: totalCount, limit, offset, hasMore: sites.length === limit },
      legacy: { domain, search: searchParams.get('search'), includeHistory },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Sites API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
