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

export const COMPANY_SIZES = ['Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'] as const;

export const CATEGORIES = [
  // AI & Machine Learning
  'AI Development Platforms',
  'Machine Learning Infrastructure',
  'AI Security & Privacy',
  'AI Interaction & Interfaces',

  // Business Software
  'CRM & Sales',
  'ERP & Operations',
  'Finance & Accounting',
  'Human Resources (HR)',
  'Marketing & Customer Engagement',
  'Customer Support & Success',
  'E-commerce Platforms',
  'Project & Work Management',
  'Collaboration & Communication',
  'Scheduling & Event Management',
  'Document Management & E-Signatures',
  'Forms & Surveys',
  'Compliance & Risk Management',

  // Community & Social
  'Social Networking',
  'Community Building Platforms',
  'Collaboration & Feedback',

  // Content & Publishing
  'Content Management Systems (CMS)',
  'Community Platforms',
  'Documentation & Knowledge Base',
  'Learning Management Systems (LMS)',
  'Digital Asset Management (DAM)',
  'Publishing',
  'Blogging & Personal Sites',

  // Data & Analytics
  'Web & Product Analytics',
  'Business Intelligence & Reporting',
  'Data Engineering & Integration',
  'Data Warehousing & Processing',
  'Data Extraction & Web Scraping',

  // Developer Tools
  'Website Builders',
  'IDEs & Code Editors',
  'Frameworks & Platforms',
  'API Development & Testing',
  'Testing & Quality Assurance',
  'Version Control & Collaboration',
  'Code Analysis & Transformation',
  'Build & Deployment',
  'Integration Platforms',
  'AI Assisted Coding',

  // Infrastructure & Operations
  'Search Engines',
  'Cloud Infrastructure Management',
  'Server & VM Management',
  'Monitoring & Observability',
  'Databases',
  'Networking & Connectivity',
  'Orchestration & Scheduling',
  'Messaging & Event Streaming',
  'Storage Solutions',
  'Backup & Recovery',

  // Design & Prototyping
  'Design & Prototyping',

  // Cryptocurrency & Blockchain
  'Cryptocurrency & Blockchain',

  // Finance & Fintech
  'Finance & Fintech',

  // Gaming
  'Gaming',

  // Internet of Things (IoT)
  'Internet of Things (IoT)',

  // Logistics & Supply Chain
  'Logistics & Supply Chain',

  // Media & Streaming
  'Media & Streaming',

  // Productivity & Utilities
  'Note Taking & Knowledge Management',
  'Password & Secret Management',
  'Screen Capture & Recording',
  'File Management & Sync',
  'Email & Communication',
  'Automation',
  'Time & Task Management',
  'Personal Finance Management',
  'Design & Visualization',
  'Bookmark & Content Management',
  'Remote Desktop & Access',
  'Browsers & Extensions',

  // Security & Privacy
  'Identity & Access Management (IAM)',
  'Secrets Management',
  'Threat Detection & Response',
  'Network Security',
  'Data Security & Privacy',
  'Application Security',
  'Fraud Prevention',

  // Miscellaneous
  'Miscellaneous',
] as const;

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
          title: string | null;
          industry: string | null;
          category: string | null;
          country: string | null;
          language: string | null;
          company_size: string | null;
          is_verified: boolean;
          is_ai_classified: boolean;
          confidence: number | null;
          last_classified: string | null;
          is_featured: boolean;
          views: number;
          likes: number;
          tags: string[];
          affiliate_link: string | null;
          slug: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          url: string;
          path: string;
          title?: string | null;
          industry?: string | null;
          category?: string | null;
          country?: string | null;
          language?: string | null;
          company_size?: string | null;
          is_verified?: boolean;
          is_ai_classified?: boolean;
          confidence?: number | null;
          last_classified?: string | null;
          is_featured?: boolean;
          views?: number;
          likes?: number;
          tags?: string[];
          affiliate_link?: string | null;
          slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          url?: string;
          path?: string;
          title?: string | null;
          industry?: string | null;
          category?: string | null;
          country?: string | null;
          language?: string | null;
          company_size?: string | null;
          is_verified?: boolean;
          is_ai_classified?: boolean;
          confidence?: number | null;
          last_classified?: string | null;
          is_featured?: boolean;
          views?: number;
          likes?: number;
          tags?: string[];
          affiliate_link?: string | null;
          slug?: string | null;
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
          ld_json_metadata: string | null;
          raw_metadata: string | null;
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
          ld_json_metadata?: string | null;
          raw_metadata?: string | null;
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
          ld_json_metadata?: string | null;
          raw_metadata?: string | null;
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
