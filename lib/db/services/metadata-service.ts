import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, SiteMetadata, SiteMetadataInsert } from '../types';
import type { ScrapedMetadata } from '../../scraper/types';

export class MetadataService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Parse JSON metadata fields into objects
   */
  private parseMetadataFields(metadata: SiteMetadata): SiteMetadata {
    const parsed = { ...metadata };

    // Helper function to safely parse JSON
    const safeJsonParse = (jsonString: string | null) => {
      if (!jsonString) return null;
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn('Failed to parse JSON metadata:', error);
        return jsonString; // Return original string if parsing fails
      }
    };

    // Replace JSON string fields with parsed objects
    (parsed as any).basic_metadata = safeJsonParse(metadata.basic_metadata);
    (parsed as any).open_graph_metadata = safeJsonParse(metadata.open_graph_metadata);
    (parsed as any).twitter_metadata = safeJsonParse(metadata.twitter_metadata);
    (parsed as any).structured_metadata = safeJsonParse(metadata.structured_metadata);
    (parsed as any).images = safeJsonParse(metadata.images);
    (parsed as any).link_metadata = safeJsonParse(metadata.link_metadata);
    (parsed as any).other_metadata = safeJsonParse(metadata.other_metadata);
    (parsed as any).raw_metadata = safeJsonParse(metadata.raw_metadata);

    return parsed;
  }

  /**
   * Save metadata for a site, creating a new version
   */
  async saveMetadata(
    siteId: string,
    metadata: ScrapedMetadata,
    scrapedAt: string,
    performance?: {
      responseTime: number;
      contentLength: number;
      httpStatus: number;
    },
  ): Promise<SiteMetadata> {
    // Get the current latest version for this site
    const { data: currentLatest } = await this.supabase
      .from('site_metadata')
      .select('version')
      .eq('site_id', siteId)
      .eq('is_latest', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = currentLatest ? currentLatest.version + 1 : 1;

    // Mark all previous versions as not latest
    if (currentLatest) {
      await this.supabase.from('site_metadata').update({ is_latest: false }).eq('site_id', siteId);
    }

    // Create new metadata record
    const newMetadata: SiteMetadataInsert = {
      site_id: siteId,
      version: nextVersion,
      title: metadata.basic.title || metadata.openGraph.title || undefined,
      description: metadata.basic.description || metadata.openGraph.description || undefined,
      basic_metadata: JSON.stringify(metadata.basic),
      open_graph_metadata: JSON.stringify(metadata.openGraph),
      twitter_metadata: JSON.stringify(metadata.twitter),
      structured_metadata: JSON.stringify(metadata.structured),
      images: JSON.stringify(metadata.images),
      link_metadata: JSON.stringify(metadata.links),
      other_metadata: JSON.stringify(metadata.other),
      raw_metadata: JSON.stringify(metadata.raw),
      response_time: performance?.responseTime,
      content_length: performance?.contentLength,
      http_status: performance?.httpStatus,
      scraped_at: scrapedAt,
      is_latest: true,
    };

    const { data: result } = await this.supabase.from('site_metadata').insert(newMetadata).select().single();

    if (!result) {
      throw new Error('Failed to save metadata');
    }

    return result;
  }

  /**
   * Get latest metadata for a site
   */
  async getLatestMetadata(siteId: string): Promise<SiteMetadata | null> {
    const { data } = await this.supabase.from('site_metadata').select('*').eq('site_id', siteId).eq('is_latest', true).single();

    return data ? this.parseMetadataFields(data) : null;
  }

  /**
   * Get latest metadata for a site by URL
   */
  async getLatestMetadataByUrl(url: string) {
    const { data } = await this.supabase
      .from('site_metadata')
      .select(
        `
        *,
        site:sites(*,domain:domains(*))
      `,
      )
      .eq('sites.url', url)
      .eq('is_latest', true)
      .single();

    return data ? this.parseMetadataFields(data) : null;
  }

  /**
   * Get all versions of metadata for a site
   */
  async getMetadataHistory(siteId: string): Promise<SiteMetadata[]> {
    const { data } = await this.supabase.from('site_metadata').select('*').eq('site_id', siteId).order('version', { ascending: false });

    return data ? data.map((metadata) => this.parseMetadataFields(metadata)) : [];
  }

  /**
   * Get all sites with their latest metadata
   */
  async getAllSitesWithLatestMetadata() {
    const { data } = await this.supabase
      .from('site_metadata')
      .select(
        `
        *,
        site:sites(*,domain:domains(*))
      `,
      )
      .eq('is_latest', true)
      .order('scraped_at', { ascending: false });

    return data ? data.map((metadata) => this.parseMetadataFields(metadata)) : [];
  }

  /**
   * Get metadata statistics
   */
  async getMetadataStats() {
    // Get total counts using Supabase's count feature
    const [{ count: totalSites }, { count: totalDomains }, { count: totalMetadataRecords }] = await Promise.all([
      this.supabase.from('sites').select('*', { count: 'exact', head: true }),
      this.supabase.from('domains').select('*', { count: 'exact', head: true }),
      this.supabase.from('site_metadata').select('*', { count: 'exact', head: true }),
    ]);

    // Get latest scraped timestamp
    const { data: latestRecord } = await this.supabase
      .from('site_metadata')
      .select('scraped_at')
      .eq('is_latest', true)
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single();

    return {
      totalSites: totalSites || 0,
      totalDomains: totalDomains || 0,
      totalMetadataRecords: totalMetadataRecords || 0,
      latestScrapedAt: latestRecord?.scraped_at,
    };
  }

  /**
   * Search sites by title or description
   */
  async searchSites(query: string) {
    const { data } = await this.supabase
      .from('site_metadata')
      .select(
        `
        *,
        site:sites(*,domain:domains(*))
      `,
      )
      .eq('is_latest', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('scraped_at', { ascending: false });

    return data ? data.map((metadata) => this.parseMetadataFields(metadata)) : [];
  }
}
