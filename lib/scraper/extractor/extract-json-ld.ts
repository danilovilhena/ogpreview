import * as cheerio from 'cheerio';
import type { JsonLdMetadata } from '../types';

export function extractJsonLd($: cheerio.CheerioAPI): JsonLdMetadata {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const jsonLd = jsonLdScripts
    .map((_, el) => {
      try {
        return JSON.parse($(el).html() || '');
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);

  return { jsonLd };
}
