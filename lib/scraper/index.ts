import * as cheerio from 'cheerio';
import type { ScrapedMetadata } from './types';
import {
  extractBasicMetadata,
  extractOpenGraphMetadata,
  extractTwitterMetadata,
  extractStructuredMetadata,
  extractLinkMetadata,
  extractOtherMetadata,
  extractImages,
  extractRawMetadata,
} from './extractors';
import { cleanupMetadata } from './data-cleaner';

export function extractMetadata(html: string, baseUrl: URL): ScrapedMetadata {
  const $ = cheerio.load(html);

  const basic = extractBasicMetadata($, baseUrl);
  const openGraph = extractOpenGraphMetadata($, baseUrl);
  const twitter = extractTwitterMetadata($, baseUrl);
  const structured = extractStructuredMetadata($);
  const links = extractLinkMetadata($, baseUrl);
  const other = extractOtherMetadata($, baseUrl);
  const raw = extractRawMetadata($);

  const images = extractImages($, baseUrl, openGraph.images || [], twitter.images || []);

  const metadata: ScrapedMetadata = {
    basic,
    openGraph,
    twitter,
    structured,
    images,
    links,
    other,
    raw,
  };

  cleanupMetadata(metadata);
  return metadata;
}

export * from './types';
export { resolveUrl, resolveUrls } from './url-resolver';
export { cleanupMetadata } from './data-cleaner';
