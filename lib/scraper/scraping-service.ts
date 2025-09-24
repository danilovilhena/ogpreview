import { extractMetadata, guardedFetchHtml, handleScrapingError } from './index';
import { getSupabase, SiteService, MetadataService } from '@/lib/db';
import type { ScrapedMetadata } from './types';

export interface ScrapingResult {
  success: boolean;
  url: string;
  metadata?: ScrapedMetadata;
  scrapedAt?: string;
  saved?: boolean;
  performance?: {
    responseTime: number;
    contentLength: number;
  };
  error?: string;
  info?: string;
}

export class ScrapingService {
  private supabase = getSupabase();
  private siteService = new SiteService(this.supabase);
  private metadataService = new MetadataService(this.supabase);

  /**
   * Add random delay to avoid being detected as a bot
   */
  private async addRandomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Scrape a single URL and save the metadata to the database
   */
  async scrapeUrl(url: string): Promise<ScrapingResult> {
    let targetUrl: URL;
    try {
      targetUrl = new URL(url?.includes('http') ? url : `https://${url}`);
      // Clear query parameters
      targetUrl.search = '';

      // Remove www. prefix to prevent duplicates
      if (targetUrl.hostname.startsWith('www.')) {
        targetUrl.hostname = targetUrl.hostname.substring(4);
      }
    } catch {
      return {
        success: false,
        url,
        error: 'Invalid URL format',
      };
    }

    try {
      // Add random delay before making request to avoid rate limiting
      await this.addRandomDelay();

      // Performance tracking
      const startTime = Date.now();

      const html = await guardedFetchHtml(targetUrl);

      const responseTime = Date.now() - startTime;
      const metadata = extractMetadata(html, targetUrl);
      const scrapedAt = new Date().toISOString();

      // Check if there's an OG image - early return if not
      const hasOgImage = metadata.openGraph?.images && metadata.openGraph.images.length > 0;
      if (!hasOgImage) {
        return {
          success: true,
          url: targetUrl.toString(),
          metadata,
          scrapedAt,
          saved: false,
          performance: {
            responseTime,
            contentLength: html.length,
          },
          info: 'No Open Graph image found - not saved to database',
        };
      }

      // Save to database
      let saved = false;
      try {
        // Get or create domain and site
        const domain = await this.siteService.upsertDomain(targetUrl.hostname);
        const site = await this.siteService.upsertSite(targetUrl.toString(), domain.id);

        // Save metadata with performance info
        await this.metadataService.saveMetadata(site.id, metadata, scrapedAt, {
          responseTime,
          contentLength: html.length,
          httpStatus: 200, // Assuming success since we got here
        });

        saved = true;
      } catch (dbError) {
        console.error('Failed to save to database:', dbError);
        // Continue without failing the request
      }

      return {
        success: true,
        url: targetUrl.toString(),
        metadata,
        scrapedAt,
        saved,
        performance: {
          responseTime,
          contentLength: html.length,
        },
      };
    } catch (error: unknown) {
      console.error('Scraping error for URL:', targetUrl?.toString() || url, error);

      const { error: errorMessage } = handleScrapingError(error);
      return {
        success: false,
        url: targetUrl?.toString() || url,
        error: errorMessage,
      };
    }
  }

  /**
   * Scrape multiple URLs concurrently with controlled concurrency
   */
  async scrapeUrls(urls: string[], maxConcurrency: number = 1): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    const uniqueUrls = [...new Set(urls)]; // Remove duplicates

    console.log(`Starting bulk scrape of ${uniqueUrls.length} unique URLs with concurrency ${maxConcurrency}`);

    // Process URLs in batches to control concurrency
    for (let i = 0; i < uniqueUrls.length; i += maxConcurrency) {
      const batch = uniqueUrls.slice(i, i + maxConcurrency);
      const batchNumber = Math.floor(i / maxConcurrency) + 1;
      const totalBatches = Math.ceil(uniqueUrls.length / maxConcurrency);

      console.log(`Processing batch ${batchNumber}/${totalBatches} (URLs ${i + 1}-${Math.min(i + maxConcurrency, uniqueUrls.length)})`);

      const batchPromises = batch.map((url) => this.scrapeUrl(url));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successfulInBatch = batchResults.filter((r) => r.success).length;
        console.log(`Batch ${batchNumber} completed: ${successfulInBatch}/${batch.length} successful`);

        // Add delay between batches to avoid overwhelming servers
        if (i + maxConcurrency < uniqueUrls.length) {
          console.log('Adding delay between batches...');
          await this.addRandomDelay(2000, 5000); // 2-5 second delay between batches
        }
      } catch (error) {
        console.error('Batch scraping error:', error);
        // If a batch fails, add error results for all URLs in the batch
        const errorResults = batch.map((url) => ({
          success: false,
          url,
          error: 'Batch processing failed',
        }));
        results.push(...errorResults);
        console.log(`Batch ${batchNumber} failed: 0/${batch.length} successful`);
      }
    }

    const totalSuccessful = results.filter((r) => r.success).length;
    console.log(`Bulk scrape completed: ${totalSuccessful}/${uniqueUrls.length} URLs successful`);

    return results;
  }
}

// Export a singleton instance for convenience
export const scrapingService = new ScrapingService();
