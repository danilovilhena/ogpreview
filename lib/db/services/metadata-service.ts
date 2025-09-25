/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, SiteMetadata, SiteMetadataInsert, SiteMetadataWithSite } from '../types';
import type { ScrapedMetadata } from '../../scraper/types';

export class MetadataService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Parse JSON metadata fields into objects
   */
  private parseMetadataFields<T extends SiteMetadata>(metadata: T): T {
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
    Object.assign(parsed, {
      basic: safeJsonParse(metadata.basic_metadata),
      openGraph: safeJsonParse(metadata.open_graph_metadata),
      twitter: safeJsonParse(metadata.twitter_metadata),
      jsonLd: safeJsonParse(metadata.ld_json_metadata),
      raw: safeJsonParse(metadata.raw_metadata),
      basic_metadata: undefined,
      open_graph_metadata: undefined,
      twitter_metadata: undefined,
      ld_json_metadata: undefined,
      raw_metadata: undefined,
    });

    return parsed;
  }

  /**
   * Save metadata for a site, creating a new version
   */
  async saveMetadata(siteId: string, metadata: ScrapedMetadata): Promise<SiteMetadata> {
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

    // Create new metadata record with safe property access
    const newMetadata: SiteMetadataInsert = {
      site_id: siteId,
      version: nextVersion,
      title: metadata.basic?.title || metadata.openGraph?.title || '',
      description: metadata.basic?.description || metadata.openGraph?.description || '',
      basic_metadata: JSON.stringify(metadata.basic || {}),
      open_graph_metadata: JSON.stringify(metadata.openGraph || {}),
      twitter_metadata: JSON.stringify(metadata.twitter || {}),
      ld_json_metadata: JSON.stringify(metadata.jsonLd || {}),
      raw_metadata: JSON.stringify(metadata.raw || {}),
      scraped_at: new Date().toISOString(),
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
  async getLatestMetadataByUrl(url: string): Promise<SiteMetadataWithSite | null> {
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

    return data ? this.parseMetadataFields(data as SiteMetadataWithSite) : null;
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
  async getAllSitesWithLatestMetadata(): Promise<SiteMetadataWithSite[]> {
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

    return data ? data.map((metadata) => this.parseMetadataFields(metadata as SiteMetadataWithSite)) : [];
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
  async searchSites(query: string): Promise<SiteMetadataWithSite[]> {
    const searchTerm = query.toLowerCase();
    const { data } = await this.supabase
      .from('site_metadata')
      .select(
        `
        *,
        site:sites(*,domain:domains(*))
      `,
      )
      .eq('is_latest', true)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('scraped_at', { ascending: false });

    return data ? data.map((metadata) => this.parseMetadataFields(metadata as SiteMetadataWithSite)) : [];
  }

  /**
   * Get the total count of sites that match the given filters
   */
  async getFilteredSitesCount(filters: any): Promise<number> {
    let query = this.supabase.from('site_metadata').select('*', { count: 'exact', head: true }).eq('is_latest', true);

    // Search in metadata (title, description) - simplified for now
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { count } = await query;
    return count || 0;
  }

  /**
   * Get sites with metadata that match filters and search terms
   */
  async getFilteredSitesWithMetadata(filters: any, limit: number = 50, offset: number = 0): Promise<SiteMetadataWithSite[]> {
    let query = this.supabase
      .from('site_metadata')
      .select(
        `
        *,
        site:sites(*,domain:domains(*))
      `,
      )
      .eq('is_latest', true);

    // Search in metadata (title, description) - simplified for now
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data } = await query.order('scraped_at', { ascending: false }).range(offset, offset + limit - 1);

    return data ? data.map((metadata) => this.parseMetadataFields(metadata as SiteMetadataWithSite)) : [];
  }
}
