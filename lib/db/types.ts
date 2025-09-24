export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// === FILTER ENUMS FOR PROGRAMMATIC SEO ===

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Media',
  'Real Estate',
  'Travel',
  'Food & Beverage',
  'Fashion',
  'Sports',
  'Gaming',
  'Legal',
  'Consulting',
  'Manufacturing',
  'Automotive',
  'Energy',
  'Other',
] as const;

export const SECTORS = ['B2B', 'B2C', 'B2B2C', 'Government', 'Non-profit'] as const;

export const BUSINESS_MODELS = ['SaaS', 'Marketplace', 'E-commerce', 'Media', 'Service', 'API', 'Platform', 'Tool'] as const;

export const COMPANY_STAGES = ['Startup', 'Scaleup', 'Enterprise', 'Public', 'Acquired'] as const;

export const COMPANY_SIZES = ['Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'] as const;

export const FUNDING_STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO', 'Acquired', 'Bootstrapped'] as const;

export const SITE_TYPES = [
  'Corporate',
  'Product',
  'Blog',
  'E-commerce',
  'Portfolio',
  'Documentation',
  'Landing Page',
  'Directory',
  'News',
  'Community',
] as const;

export const PRICING_MODELS = ['Free', 'Freemium', 'Subscription', 'One-time', 'Custom', 'Contact'] as const;

export interface Database {
  public: {
    Tables: {
      domains: {
        Row: {
          id: string;
          domain: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          domain_id: string;
          url: string;
          path: string;
          industry: string | null;
          sector: string | null;
          business_model: string | null;
          company_stage: string | null;
          country: string | null;
          region: string | null;
          city: string | null;
          language: string | null;
          market_focus: string | null;
          company_size: string | null;
          employee_count: number | null;
          revenue: string | null;
          funding_stage: string | null;
          total_funding: string | null;
          platform: string | null;
          hosting_provider: string | null;
          cdn_provider: string | null;
          site_type: string | null;
          content_category: string | null;
          primary_cta: string | null;
          monetization: string | null;
          traffic_tier: string | null;
          domain_authority: number | null;
          has_ecommerce: boolean;
          has_blog: boolean;
          has_newsletter_signup: boolean;
          has_chatbot: boolean;
          competitor_tier: string | null;
          pricing_model: string | null;
          target_audience: string | null;
          is_verified: boolean;
          is_ai_classified: boolean;
          confidence: number | null;
          last_classified: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          url: string;
          path: string;
          industry?: string | null;
          sector?: string | null;
          business_model?: string | null;
          company_stage?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          language?: string | null;
          market_focus?: string | null;
          company_size?: string | null;
          employee_count?: number | null;
          revenue?: string | null;
          funding_stage?: string | null;
          total_funding?: string | null;
          platform?: string | null;
          hosting_provider?: string | null;
          cdn_provider?: string | null;
          site_type?: string | null;
          content_category?: string | null;
          primary_cta?: string | null;
          monetization?: string | null;
          traffic_tier?: string | null;
          domain_authority?: number | null;
          has_ecommerce?: boolean;
          has_blog?: boolean;
          has_newsletter_signup?: boolean;
          has_chatbot?: boolean;
          competitor_tier?: string | null;
          pricing_model?: string | null;
          target_audience?: string | null;
          is_verified?: boolean;
          is_ai_classified?: boolean;
          confidence?: number | null;
          last_classified?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          url?: string;
          path?: string;
          industry?: string | null;
          sector?: string | null;
          business_model?: string | null;
          company_stage?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          language?: string | null;
          market_focus?: string | null;
          company_size?: string | null;
          employee_count?: number | null;
          revenue?: string | null;
          funding_stage?: string | null;
          total_funding?: string | null;
          platform?: string | null;
          hosting_provider?: string | null;
          cdn_provider?: string | null;
          site_type?: string | null;
          content_category?: string | null;
          primary_cta?: string | null;
          monetization?: string | null;
          traffic_tier?: string | null;
          domain_authority?: number | null;
          has_ecommerce?: boolean;
          has_blog?: boolean;
          has_newsletter_signup?: boolean;
          has_chatbot?: boolean;
          competitor_tier?: string | null;
          pricing_model?: string | null;
          target_audience?: string | null;
          is_verified?: boolean;
          is_ai_classified?: boolean;
          confidence?: number | null;
          last_classified?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sites_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'domains';
            referencedColumns: ['id'];
          },
        ];
      };
      site_metadata: {
        Row: {
          id: string;
          site_id: string;
          version: number;
          title: string | null;
          description: string | null;
          basic_metadata: string | null;
          open_graph_metadata: string | null;
          twitter_metadata: string | null;
          structured_metadata: string | null;
          images: string | null;
          link_metadata: string | null;
          other_metadata: string | null;
          raw_metadata: string | null;
          response_time: number | null;
          content_length: number | null;
          http_status: number | null;
          scraped_at: string;
          created_at: string;
          is_latest: boolean;
        };
        Insert: {
          id?: string;
          site_id: string;
          version?: number;
          title?: string | null;
          description?: string | null;
          basic_metadata?: string | null;
          open_graph_metadata?: string | null;
          twitter_metadata?: string | null;
          structured_metadata?: string | null;
          images?: string | null;
          link_metadata?: string | null;
          other_metadata?: string | null;
          raw_metadata?: string | null;
          response_time?: number | null;
          content_length?: number | null;
          http_status?: number | null;
          scraped_at: string;
          created_at?: string;
          is_latest?: boolean;
        };
        Update: {
          id?: string;
          site_id?: string;
          version?: number;
          title?: string | null;
          description?: string | null;
          basic_metadata?: string | null;
          open_graph_metadata?: string | null;
          twitter_metadata?: string | null;
          structured_metadata?: string | null;
          images?: string | null;
          link_metadata?: string | null;
          other_metadata?: string | null;
          raw_metadata?: string | null;
          response_time?: number | null;
          content_length?: number | null;
          http_status?: number | null;
          scraped_at?: string;
          created_at?: string;
          is_latest?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'site_metadata_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Domain = Database['public']['Tables']['domains']['Row'];
export type Site = Database['public']['Tables']['sites']['Row'];
export type SiteMetadata = Database['public']['Tables']['site_metadata']['Row'];

export type DomainInsert = Database['public']['Tables']['domains']['Insert'];
export type SiteInsert = Database['public']['Tables']['sites']['Insert'];
export type SiteMetadataInsert = Database['public']['Tables']['site_metadata']['Insert'];

export type DomainUpdate = Database['public']['Tables']['domains']['Update'];
export type SiteUpdate = Database['public']['Tables']['sites']['Update'];
export type SiteMetadataUpdate = Database['public']['Tables']['site_metadata']['Update'];

// Combined types for convenience
export type SiteWithDomain = Site & { domain: Domain };
export type SiteMetadataWithSite = SiteMetadata & { site: SiteWithDomain };
