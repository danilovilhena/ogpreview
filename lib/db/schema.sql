-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domains table - stores unique domains
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sites table - stores individual URLs within domains
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL,

  -- === PROGRAMMATIC SEO FILTERING COLUMNS ===

  -- Business Classification
  industry VARCHAR(100), -- Technology, Healthcare, Finance, E-commerce, etc.
  sector VARCHAR(50), -- B2B, B2C, B2B2C, Government, Non-profit
  business_model VARCHAR(100), -- SaaS, Marketplace, E-commerce, Media, Service
  company_stage VARCHAR(50), -- Startup, Scaleup, Enterprise, Public

  -- Geographic & Market
  country VARCHAR(100), -- US, UK, DE, FR, etc. (ISO country codes)
  region VARCHAR(100), -- North America, Europe, APAC, LATAM, MENA
  city VARCHAR(100), -- San Francisco, London, Berlin, etc.
  language VARCHAR(10), -- en, es, fr, de, etc. (primary language)
  market_focus VARCHAR(50), -- Global, Regional, Local, Niche

  -- Company Size & Scale
  company_size VARCHAR(100), -- Startup (1-10), Small (11-50), Medium (51-200), Large (201-1000), Enterprise (1000+)
  employee_count INTEGER, -- Approximate number for precise filtering
  revenue VARCHAR(50), -- <1M, 1M-10M, 10M-100M, 100M-1B, 1B+
  funding_stage VARCHAR(50), -- Pre-seed, Seed, Series A, Series B, Series C+, IPO, Acquired
  total_funding VARCHAR(50), -- <1M, 1M-10M, 10M-100M, 100M-1B, 1B+

  -- Technology & Platform
  platform VARCHAR(100), -- Web, Mobile, Desktop, API, Chrome Extension, etc.
  hosting_provider VARCHAR(100), -- AWS, GCP, Azure, Vercel, Netlify, etc.
  cdn_provider VARCHAR(100), -- Cloudflare, AWS CloudFront, etc.

  -- Content & Purpose
  site_type VARCHAR(100), -- Corporate, Product, Blog, E-commerce, Portfolio, Documentation, etc.
  content_category VARCHAR(100), -- Marketing, Technical, Educational, News, Entertainment
  primary_cta VARCHAR(100), -- Sign Up, Buy Now, Contact Us, Download, Subscribe
  monetization VARCHAR(100), -- Subscription, One-time, Freemium, Ads, Affiliate, Free

  -- SEO & Marketing
  traffic_tier VARCHAR(50), -- Low (<10K), Medium (10K-100K), High (100K-1M), Very High (1M+)
  domain_authority INTEGER, -- 1-100 (can be filled by AI later)
  has_ecommerce BOOLEAN DEFAULT FALSE,
  has_blog BOOLEAN DEFAULT FALSE,
  has_newsletter_signup BOOLEAN DEFAULT FALSE,
  has_chatbot BOOLEAN DEFAULT FALSE,

  -- Competitive Intelligence
  competitor_tier VARCHAR(50), -- Direct, Indirect, Adjacent, Substitute
  pricing_model VARCHAR(50), -- Free, Freemium, Subscription, One-time, Custom, Contact
  target_audience VARCHAR(100), -- SMB, Mid-market, Enterprise, Consumer, Developer

  -- Manual/AI flags for data quality
  is_verified BOOLEAN DEFAULT FALSE, -- Manual verification
  is_ai_classified BOOLEAN DEFAULT FALSE, -- AI has processed
  confidence REAL, -- AI confidence score 0-1
  last_classified TIMESTAMPTZ, -- When AI last processed this

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site metadata table - stores versioned metadata for each site
CREATE TABLE site_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,

  -- Core metadata
  title TEXT,
  description TEXT,

  -- Metadata stored as JSON strings
  basic_metadata TEXT,
  open_graph_metadata TEXT,
  twitter_metadata TEXT,
  structured_metadata TEXT,
  images TEXT,
  link_metadata TEXT,
  other_metadata TEXT,
  raw_metadata TEXT,

  -- Performance and quality metrics
  response_time REAL, -- In milliseconds
  content_length INTEGER, -- In bytes
  http_status INTEGER,

  -- Timestamps
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Index for efficient latest version queries
  is_latest BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_sites_domain_id ON sites(domain_id);
CREATE INDEX idx_sites_industry ON sites(industry);
CREATE INDEX idx_sites_country ON sites(country);
CREATE INDEX idx_sites_site_type ON sites(site_type);
CREATE INDEX idx_sites_is_ai_classified ON sites(is_ai_classified);
CREATE INDEX idx_sites_created_at ON sites(created_at);

CREATE INDEX idx_site_metadata_site_id ON site_metadata(site_id);
CREATE INDEX idx_site_metadata_is_latest ON site_metadata(is_latest);
CREATE INDEX idx_site_metadata_scraped_at ON site_metadata(scraped_at);

-- Create triggers to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - TEMPORARILY DISABLED FOR TESTING
-- ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE site_metadata ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS to test if it's causing the issue
ALTER TABLE domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_metadata DISABLE ROW LEVEL SECURITY;
