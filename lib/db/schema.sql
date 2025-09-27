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

  -- AI-populated content
  title TEXT, -- Site title that AI will extract, for example if extracted title was: "Contra - A professional network for the jobs and skills of the future", the title would be "Contra"

  -- Essential classification that AI can determine
  industry VARCHAR(100), -- Technology, Healthcare, Finance, E-commerce, etc.
  category VARCHAR(100), -- Email Marketing, CRM Software, AI Writing Tools, Project Management, etc.
  country VARCHAR(100), -- US, UK, DE, FR, etc. (ISO country codes for the country of origin)  
  language VARCHAR(10), -- en, es, fr, de, etc. (primary language)
  company_size VARCHAR(100), -- Startup (1-10), Small (11-50), Medium (51-200), Large (201-1000), Enterprise (1000+)

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
  ld_json_metadata TEXT,
  raw_metadata TEXT,

  -- Timestamps
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Index for efficient latest version queries
  is_latest BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_sites_domain_id ON sites(domain_id);
CREATE INDEX idx_sites_industry ON sites(industry);
CREATE INDEX idx_sites_category ON sites(category);
CREATE INDEX idx_sites_country ON sites(country);
CREATE INDEX idx_sites_language ON sites(language);
CREATE INDEX idx_sites_company_size ON sites(company_size);
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

-- Add new columns to sites table
ALTER TABLE sites ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN views INTEGER DEFAULT 0;
ALTER TABLE sites ADD COLUMN likes INTEGER DEFAULT 0;
ALTER TABLE sites ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE sites ADD COLUMN affiliate_link TEXT;
ALTER TABLE sites ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Create indexes for new columns
CREATE INDEX idx_sites_is_featured ON sites(is_featured);
CREATE INDEX idx_sites_views ON sites(views);
CREATE INDEX idx_sites_likes ON sites(likes);
CREATE INDEX idx_sites_tags ON sites USING GIN(tags);
CREATE INDEX idx_sites_slug ON sites(slug);