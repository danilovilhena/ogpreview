import { ScrapedMetadata } from '../types';

export function hasValidOgImage(metadata: ScrapedMetadata): boolean {
  return !!(metadata.openGraph?.images && metadata.openGraph.images.length > 0);
}
