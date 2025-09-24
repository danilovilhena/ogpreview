// Types for our API response
export interface OpenGraphMetadata {
  'og:title'?: string;
  'og:description'?: string;
  'og:image'?: string;
  'og:url'?: string;
  'og:type'?: string;
  'og:site_name'?: string;
}

export interface SiteMetadata {
  id: string;
  site_id: string;
  title: string | null;
  description: string | null;
  open_graph_metadata: string | null;
  scraped_at: string;
}

export interface Domain {
  id: string;
  domain: string;
}

export interface Site {
  id: string;
  url: string;
  domain: Domain;
}

export interface SiteData {
  metadata: SiteMetadata | null;
  site: Site;
  domain: Domain;
}

export interface ApiResponse {
  success: boolean;
  data: SiteData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
