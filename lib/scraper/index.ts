import { extractMetadata } from './extractor';
import { fetchHtml, handleScrapingError } from './html-fetcher';
import { hasValidOgImage } from './lib/has-valid-og-image';
import { processMetadataImages } from './image-cdn-processor';
import { normalizeUrl } from './lib/normalize-url';
import { saveScrapedData } from './lib/save-scraped-data';
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

/**
 * Scrape a single URL and save the metadata to the database
 */
export async function scrapeUrl(url: string): Promise<ScrapingResult> {
  const urlResult = normalizeUrl(url);
  if (!urlResult.success) return { success: false, url, error: urlResult.error };

  const targetUrl = urlResult.url;

  try {
    const html = await fetchHtml(targetUrl);
    const metadata = extractMetadata(html, targetUrl);

    if (!hasValidOgImage(metadata)) {
      return { success: true, url: targetUrl.toString(), metadata, saved: false, info: 'No Open Graph image found' };
    }

    // Process images and upload to CDN before saving
    const processedMetadata = await processMetadataImages(metadata);

    // Save to database
    const saved = await saveScrapedData(targetUrl, processedMetadata);

    return { success: true, url: targetUrl.toString(), metadata: processedMetadata, saved };
  } catch (error: unknown) {
    console.error('Scraping error for URL:', targetUrl?.toString() || url, error);
    const { error: errorMessage } = handleScrapingError(error);
    return { success: false, url: targetUrl?.toString() || url, error: errorMessage };
  }
}

/**
 * Process a batch of URLs with error handling
 */
export async function processBatch(
  batch: string[],
  batchNumber: number,
  totalBatches: number,
  startIndex: number,
  maxConcurrency: number,
): Promise<ScrapingResult[]> {
  console.log(`Processing batch ${batchNumber}/${totalBatches} (URLs ${startIndex + 1}-${Math.min(startIndex + maxConcurrency, startIndex + batch.length)})`);

  const batchPromises = batch.map((url) => scrapeUrl(url));

  try {
    const batchResults = await Promise.all(batchPromises);

    const successfulInBatch = batchResults.filter((r) => r.success).length;
    console.log(`Batch ${batchNumber} completed: ${successfulInBatch}/${batch.length} successful`);

    return batchResults;
  } catch (error) {
    console.error('Batch scraping error:', error);
    // If a batch fails, add error results for all URLs in the batch
    const errorResults = batch.map((url) => ({
      success: false,
      url,
      error: 'Batch processing failed',
    }));
    console.log(`Batch ${batchNumber} failed: 0/${batch.length} successful`);
    return errorResults;
  }
}

/**
 * Scrape multiple URLs concurrently with controlled concurrency
 */
export async function scrapeUrls(urls: string[], maxConcurrency: number = 1): Promise<ScrapingResult[]> {
  const results: ScrapingResult[] = [];
  const uniqueUrls = [...new Set(urls)]; // Remove duplicates

  console.log(`Starting bulk scrape of ${uniqueUrls.length} unique URLs with concurrency ${maxConcurrency}`);

  // Process URLs in batches to control concurrency
  for (let i = 0; i < uniqueUrls.length; i += maxConcurrency) {
    const batch = uniqueUrls.slice(i, i + maxConcurrency);
    const batchNumber = Math.floor(i / maxConcurrency) + 1;
    const totalBatches = Math.ceil(uniqueUrls.length / maxConcurrency);

    const batchResults = await processBatch(batch, batchNumber, totalBatches, i, maxConcurrency);
    results.push(...batchResults);
  }

  const totalSuccessful = results.filter((r) => r.success).length;
  console.log(`Bulk scrape completed: ${totalSuccessful}/${uniqueUrls.length} URLs successful`);

  return results;
}
