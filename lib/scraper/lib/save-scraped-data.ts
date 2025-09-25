import { getSupabase, MetadataService, SiteService } from '@/lib/db';
import { ScrapedMetadata } from '../types';

/**
 * Save scraped metadata to database
 */
export async function saveScrapedData(targetUrl: URL, metadata: ScrapedMetadata): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const siteService = new SiteService(supabase);
    const metadataService = new MetadataService(supabase);

    const domain = await siteService.upsertDomain(targetUrl.hostname);
    const site = await siteService.upsertSite(targetUrl.toString(), domain.id);
    await metadataService.saveMetadata(site.id, metadata);

    return true;
  } catch (dbError) {
    console.error('Failed to save to database:', dbError);
    return false;
  }
}
