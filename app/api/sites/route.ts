import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, SiteService, MetadataService } from '@/lib/db';
import type { SiteFilters } from '@/lib/db/services/site-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const search = searchParams.get('search');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const getStats = searchParams.get('stats') === 'true';

    // Build comprehensive filters from query parameters
    const filters: SiteFilters = {};

    // Business Classification
    if (searchParams.get('industry')) filters.industry = searchParams.get('industry')!;
    if (searchParams.get('sector')) filters.sector = searchParams.get('sector')!;
    if (searchParams.get('businessModel')) filters.businessModel = searchParams.get('businessModel')!;
    if (searchParams.get('companyStage')) filters.companyStage = searchParams.get('companyStage')!;

    // Geographic & Market
    if (searchParams.get('country')) filters.country = searchParams.get('country')!;
    if (searchParams.get('region')) filters.region = searchParams.get('region')!;
    if (searchParams.get('city')) filters.city = searchParams.get('city')!;
    if (searchParams.get('language')) filters.language = searchParams.get('language')!;
    if (searchParams.get('marketFocus')) filters.marketFocus = searchParams.get('marketFocus')!;

    // Company Size & Scale
    if (searchParams.get('companySize')) filters.companySize = searchParams.get('companySize')!;
    if (searchParams.get('employeeCountMin')) filters.employeeCountMin = parseInt(searchParams.get('employeeCountMin')!);
    if (searchParams.get('employeeCountMax')) filters.employeeCountMax = parseInt(searchParams.get('employeeCountMax')!);
    if (searchParams.get('revenue')) filters.revenue = searchParams.get('revenue')!;
    if (searchParams.get('fundingStage')) filters.fundingStage = searchParams.get('fundingStage')!;
    if (searchParams.get('totalFunding')) filters.totalFunding = searchParams.get('totalFunding')!;

    // Technology & Platform
    if (searchParams.get('platform')) filters.platform = searchParams.get('platform')!;
    if (searchParams.get('hostingProvider')) filters.hostingProvider = searchParams.get('hostingProvider')!;
    if (searchParams.get('cdnProvider')) filters.cdnProvider = searchParams.get('cdnProvider')!;

    // Content & Purpose
    if (searchParams.get('siteType')) filters.siteType = searchParams.get('siteType')!;
    if (searchParams.get('contentCategory')) filters.contentCategory = searchParams.get('contentCategory')!;
    if (searchParams.get('primaryCta')) filters.primaryCta = searchParams.get('primaryCta')!;
    if (searchParams.get('monetization')) filters.monetization = searchParams.get('monetization')!;

    // SEO & Marketing
    if (searchParams.get('trafficTier')) filters.trafficTier = searchParams.get('trafficTier')!;
    if (searchParams.get('domainAuthorityMin')) filters.domainAuthorityMin = parseInt(searchParams.get('domainAuthorityMin')!);
    if (searchParams.get('domainAuthorityMax')) filters.domainAuthorityMax = parseInt(searchParams.get('domainAuthorityMax')!);
    if (searchParams.get('hasEcommerce')) filters.hasEcommerce = searchParams.get('hasEcommerce') === 'true';
    if (searchParams.get('hasBlog')) filters.hasBlog = searchParams.get('hasBlog') === 'true';
    if (searchParams.get('hasNewsletterSignup')) filters.hasNewsletterSignup = searchParams.get('hasNewsletterSignup') === 'true';
    if (searchParams.get('hasChatbot')) filters.hasChatbot = searchParams.get('hasChatbot') === 'true';

    // Competitive Intelligence
    if (searchParams.get('competitorTier')) filters.competitorTier = searchParams.get('competitorTier')!;
    if (searchParams.get('pricingModel')) filters.pricingModel = searchParams.get('pricingModel')!;
    if (searchParams.get('targetAudience')) filters.targetAudience = searchParams.get('targetAudience')!;

    // Data Quality
    if (searchParams.get('isVerified')) filters.isVerified = searchParams.get('isVerified') === 'true';
    if (searchParams.get('isAiClassified')) filters.isAiClassified = searchParams.get('isAiClassified') === 'true';
    if (searchParams.get('confidenceMin')) filters.confidenceMin = parseFloat(searchParams.get('confidenceMin')!);

    // Search
    if (search) filters.searchTerm = search;

    // Initialize database connection
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

    // Check if we have any filters or specific domain
    const hasFilters = Object.keys(filters).length > 0;

    if (domain) {
      // Legacy: Get sites for a specific domain (maintain backward compatibility)
      const sitesWithDomains = await siteService.getSitesByDomain(domain);

      // Get latest metadata for each site
      sites = await Promise.all(
        sitesWithDomains.map(async (siteWithDomain) => {
          const metadata = await metadataService.getLatestMetadata(siteWithDomain.id);
          return {
            metadata,
            site: siteWithDomain,
            domain: siteWithDomain.domain,
          };
        }),
      );
    } else if (hasFilters) {
      // Use comprehensive filtering system
      const filteredSites = await siteService.filterSites(filters, limit, offset);

      // Get metadata for filtered sites
      sites = await Promise.all(
        filteredSites.map(async (siteWithDomain) => {
          const metadata = await metadataService.getLatestMetadata(siteWithDomain.id);
          return {
            metadata,
            site: siteWithDomain,
            domain: siteWithDomain.domain,
          };
        }),
      );
    } else {
      // Default: Get all sites with latest metadata
      sites = await metadataService.getAllSitesWithLatestMetadata();

      // Get database statistics
      stats = await metadataService.getMetadataStats();
    }

    // Get filter statistics if requested
    if (getStats) {
      filterStats = await siteService.getFilterStats();
    }

    // If includeHistory is true, get version history for each site
    if (includeHistory && sites.length > 0) {
      const sitesWithHistory = await Promise.all(
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
      sites = sitesWithHistory;
    }

    // Apply pagination
    const paginatedSites = sites.slice(offset, offset + limit);

    const response = {
      success: true,
      data: paginatedSites,
      pagination: {
        total: sites.length,
        limit,
        offset,
        hasMore: offset + limit < sites.length,
      },
      stats,
      filterStats,
      appliedFilters: filters,
      legacy: {
        domain,
        search,
        includeHistory,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Sites API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
