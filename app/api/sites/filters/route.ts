import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, SiteService } from '@/lib/db';
import { INDUSTRIES, SECTORS, BUSINESS_MODELS, COMPANY_STAGES, COMPANY_SIZES, FUNDING_STAGES, SITE_TYPES, PRICING_MODELS } from '@/lib/db/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    // Static filter options (from enums)
    const staticFilters = {
      industries: INDUSTRIES,
      sectors: SECTORS,
      businessModels: BUSINESS_MODELS,
      companyStages: COMPANY_STAGES,
      companySizes: COMPANY_SIZES,
      fundingStages: FUNDING_STAGES,
      siteTypes: SITE_TYPES,
      pricingModels: PRICING_MODELS,

      // Additional static options
      regions: ['North America', 'Europe', 'APAC', 'LATAM', 'MENA', 'Africa'],
      platforms: ['Web', 'Mobile', 'Desktop', 'API', 'Chrome Extension', 'SaaS'],
      trafficTiers: ['Low (<10K)', 'Medium (10K-100K)', 'High (100K-1M)', 'Very High (1M+)'],
      contentCategories: ['Marketing', 'Technical', 'Educational', 'News', 'Entertainment', 'Corporate'],
      targetAudiences: ['SMB', 'Mid-market', 'Enterprise', 'Consumer', 'Developer', 'Business'],
      competitorTiers: ['Direct', 'Indirect', 'Adjacent', 'Substitute'],

      // Boolean filters
      booleanFilters: ['hasEcommerce', 'hasBlog', 'hasNewsletterSignup', 'hasChatbot', 'isVerified', 'isAiClassified'],

      // Range filters
      rangeFilters: [
        { name: 'employeeCount', min: 1, max: 10000, step: 1 },
        { name: 'domainAuthority', min: 1, max: 100, step: 1 },
        { name: 'confidence', min: 0, max: 1, step: 0.01 },
      ],
    };

    let dynamicStats = null;

    // Get dynamic statistics if requested
    if (includeStats) {
      // Initialize database connection
      let supabase;
      try {
        supabase = getSupabase();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json({ error: 'Database not available. Make sure Supabase is properly configured.' }, { status: 503 });
      }
      const siteService = new SiteService(supabase);

      dynamicStats = await siteService.getFilterStats();
    }

    const response = {
      success: true,
      staticFilters,
      dynamicStats,
      usage: {
        endpoint: '/api/sites',
        examples: {
          basicFilter: '/api/sites?industry=Technology&country=US',
          multipleFilters: '/api/sites?industry=Technology&companySize=Medium (51-200)&hasEcommerce=true',
          rangeFilter: '/api/sites?domainAuthorityMin=50&domainAuthorityMax=90',
          searchWithFilters: '/api/sites?search=api&platform=Web&country=US',
          withStats: '/api/sites?stats=true',
          pagination: '/api/sites?limit=25&offset=50',
        },
        supportedParameters: [
          'industry',
          'sector',
          'businessModel',
          'companyStage',
          'country',
          'region',
          'city',
          'language',
          'marketFocus',
          'companySize',
          'employeeCountMin',
          'employeeCountMax',
          'revenue',
          'fundingStage',
          'totalFunding',
          'platform',
          'hostingProvider',
          'cdnProvider',
          'siteType',
          'contentCategory',
          'primaryCta',
          'monetization',
          'trafficTier',
          'domainAuthorityMin',
          'domainAuthorityMax',
          'hasEcommerce',
          'hasBlog',
          'hasNewsletterSignup',
          'hasChatbot',
          'competitorTier',
          'pricingModel',
          'targetAudience',
          'isVerified',
          'isAiClassified',
          'confidenceMin',
          'search',
          'limit',
          'offset',
          'includeHistory',
          'stats',
        ],
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Filters API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
