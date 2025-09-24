import type { Database, Domain, Site, SiteUpdate } from '@/lib/db/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Filter interface for comprehensive site filtering
export interface SiteFilters {
  // Business Classification
  industry?: string;
  sector?: string;
  businessModel?: string;
  companyStage?: string;

  // Geographic & Market
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  marketFocus?: string;

  // Company Size & Scale
  companySize?: string;
  employeeCountMin?: number;
  employeeCountMax?: number;
  revenue?: string;
  fundingStage?: string;
  totalFunding?: string;

  // Technology & Platform
  platform?: string;
  hostingProvider?: string;
  cdnProvider?: string;

  // Content & Purpose
  siteType?: string;
  contentCategory?: string;
  primaryCta?: string;
  monetization?: string;

  // SEO & Marketing
  trafficTier?: string;
  domainAuthorityMin?: number;
  domainAuthorityMax?: number;
  hasEcommerce?: boolean;
  hasBlog?: boolean;
  hasNewsletterSignup?: boolean;
  hasChatbot?: boolean;

  // Competitive Intelligence
  competitorTier?: string;
  pricingModel?: string;
  targetAudience?: string;

  // Data Quality
  isVerified?: boolean;
  isAiClassified?: boolean;
  confidenceMin?: number;

  // Search
  searchTerm?: string;
}

export class SiteService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get or create a domain record
   */
  async upsertDomain(domainName: string): Promise<Domain> {
    // Try to find existing domain
    const { data: existingDomain, error: findError } = await this.supabase.from('domains').select('*').eq('domain', domainName).single();

    // Ignore "not found" errors since we want to create if not exists
    if (findError && findError.code !== 'PGRST116') {
      console.error('Domain lookup error:', findError);
      throw new Error(`Failed to lookup domain: ${findError.message}`);
    }

    if (existingDomain) {
      // Update the updated_at timestamp
      const { data: updatedDomain } = await this.supabase
        .from('domains')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingDomain.id)
        .select()
        .single();

      return updatedDomain!;
    }

    // Create new domain (UUID will be auto-generated)
    const { data: newDomain, error } = await this.supabase.from('domains').insert({ domain: domainName }).select().single();

    if (error) {
      console.error('Domain creation error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to create domain: ${error.message} (Code: ${error.code})`);
    }

    if (!newDomain) {
      throw new Error('Failed to create domain: No data returned');
    }

    return newDomain;
  }

  /**
   * Get or create a site record
   */
  async upsertSite(url: string, domainId: string): Promise<Site> {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;

    // Try to find existing site
    const { data: existingSite } = await this.supabase.from('sites').select('*').eq('url', url).single();

    if (existingSite) {
      // Update the updated_at timestamp
      const { data: updatedSite } = await this.supabase
        .from('sites')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingSite.id)
        .select()
        .single();

      return updatedSite!;
    }

    // Create new site
    const { data: newSite } = await this.supabase
      .from('sites')
      .insert({
        domain_id: domainId,
        url,
        path,
      })
      .select()
      .single();

    if (!newSite) {
      throw new Error('Failed to create site');
    }

    return newSite;
  }

  /**
   * Get all sites with their domains
   */
  async getAllSitesWithDomains() {
    const { data } = await this.supabase
      .from('sites')
      .select(
        `
        *,
        domain:domains(*)
      `,
      )
      .order('updated_at', { ascending: false });

    return data || [];
  }

  /**
   * Get sites by domain
   */
  async getSitesByDomain(domainName: string) {
    const { data } = await this.supabase
      .from('sites')
      .select(
        `
        *,
        domain:domains(*)
      `,
      )
      .eq('domains.domain', domainName)
      .order('updated_at', { ascending: false });

    return data || [];
  }

  /**
   * Get a specific site by URL
   */
  async getSiteByUrl(url: string) {
    const { data } = await this.supabase
      .from('sites')
      .select(
        `
        *,
        domain:domains(*)
      `,
      )
      .eq('url', url)
      .single();

    return data;
  }

  /**
   * Filter sites with comprehensive filtering for programmatic SEO
   */
  async filterSites(filters: SiteFilters, limit: number = 50, offset: number = 0) {
    let query = this.supabase.from('sites').select(`
        *,
        domain:domains(*)
      `);

    // Apply filters
    if (filters.industry) query = query.eq('industry', filters.industry);
    if (filters.sector) query = query.eq('sector', filters.sector);
    if (filters.businessModel) query = query.eq('business_model', filters.businessModel);
    if (filters.companyStage) query = query.eq('company_stage', filters.companyStage);

    if (filters.country) query = query.eq('country', filters.country);
    if (filters.region) query = query.eq('region', filters.region);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.language) query = query.eq('language', filters.language);
    if (filters.marketFocus) query = query.eq('market_focus', filters.marketFocus);

    if (filters.companySize) query = query.eq('company_size', filters.companySize);
    if (filters.employeeCountMin) query = query.gte('employee_count', filters.employeeCountMin);
    if (filters.employeeCountMax) query = query.lte('employee_count', filters.employeeCountMax);
    if (filters.revenue) query = query.eq('revenue', filters.revenue);
    if (filters.fundingStage) query = query.eq('funding_stage', filters.fundingStage);
    if (filters.totalFunding) query = query.eq('total_funding', filters.totalFunding);

    if (filters.platform) query = query.eq('platform', filters.platform);
    if (filters.hostingProvider) query = query.eq('hosting_provider', filters.hostingProvider);
    if (filters.cdnProvider) query = query.eq('cdn_provider', filters.cdnProvider);

    if (filters.siteType) query = query.eq('site_type', filters.siteType);
    if (filters.contentCategory) query = query.eq('content_category', filters.contentCategory);
    if (filters.primaryCta) query = query.eq('primary_cta', filters.primaryCta);
    if (filters.monetization) query = query.eq('monetization', filters.monetization);

    if (filters.trafficTier) query = query.eq('traffic_tier', filters.trafficTier);
    if (filters.domainAuthorityMin) query = query.gte('domain_authority', filters.domainAuthorityMin);
    if (filters.domainAuthorityMax) query = query.lte('domain_authority', filters.domainAuthorityMax);
    if (filters.hasEcommerce !== undefined) query = query.eq('has_ecommerce', filters.hasEcommerce);
    if (filters.hasBlog !== undefined) query = query.eq('has_blog', filters.hasBlog);
    if (filters.hasNewsletterSignup !== undefined) query = query.eq('has_newsletter_signup', filters.hasNewsletterSignup);
    if (filters.hasChatbot !== undefined) query = query.eq('has_chatbot', filters.hasChatbot);

    if (filters.competitorTier) query = query.eq('competitor_tier', filters.competitorTier);
    if (filters.pricingModel) query = query.eq('pricing_model', filters.pricingModel);
    if (filters.targetAudience) query = query.eq('target_audience', filters.targetAudience);

    if (filters.isVerified !== undefined) query = query.eq('is_verified', filters.isVerified);
    if (filters.isAiClassified !== undefined) query = query.eq('is_ai_classified', filters.isAiClassified);
    if (filters.confidenceMin) query = query.gte('confidence', filters.confidenceMin);

    // Search in URL, domain, or any text fields
    if (filters.searchTerm) {
      query = query.or(`url.ilike.%${filters.searchTerm}%,industry.ilike.%${filters.searchTerm}%,site_type.ilike.%${filters.searchTerm}%`);
    }

    const { data } = await query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

    return data || [];
  }

  /**
   * Get filter statistics for UI dropdowns
   */
  async getFilterStats() {
    // Get counts for each filter category using Supabase's aggregate functions
    const { data: industryStats } = await this.supabase.from('sites').select('industry').not('industry', 'is', null);

    const { data: countryStats } = await this.supabase.from('sites').select('country').not('country', 'is', null);

    const { data: siteTypeStats } = await this.supabase.from('sites').select('site_type').not('site_type', 'is', null);

    // Count occurrences manually (Supabase doesn't have built-in aggregation like SQL GROUP BY)
    const industries = industryStats?.reduce((acc: Record<string, number>, item) => {
      const value = item.industry;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});

    const countries = countryStats?.reduce((acc: Record<string, number>, item) => {
      const value = item.country;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});

    const siteTypes = siteTypeStats?.reduce((acc: Record<string, number>, item) => {
      const value = item.site_type;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      industries: Object.entries(industries || {}).map(([value, count]) => ({ value, count })),
      countries: Object.entries(countries || {}).map(([value, count]) => ({ value, count })),
      siteTypes: Object.entries(siteTypes || {}).map(([value, count]) => ({ value, count })),
    };
  }

  /**
   * Update site classification data (for AI/manual updates)
   */
  async updateSiteClassification(siteId: string, classification: Partial<SiteUpdate>, isAiGenerated: boolean = false) {
    const updateData = {
      ...classification,
      is_ai_classified: isAiGenerated,
      last_classified: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data } = await this.supabase.from('sites').update(updateData).eq('id', siteId).select();

    return data;
  }
}
