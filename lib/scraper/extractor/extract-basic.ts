import * as cheerio from 'cheerio';
import { resolveUrl } from '../lib/resolve-url';
import type { BasicMetadata } from '../types';
import { getMetaContent } from './lib/get-meta-content';

export function extractBasicMetadata($: cheerio.CheerioAPI, baseUrl: URL): BasicMetadata {
  // Find the best favicon
  let favicon: string | undefined;

  // Try to find favicon from link tags in order of preference
  const faviconSelectors = [
    'link[rel="icon"][type="image/svg+xml"]',
    'link[rel="icon"][sizes~="32x32"]',
    'link[rel="icon"][sizes~="16x16"]',
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
  ];

  for (const selector of faviconSelectors) {
    const href = $(selector).attr('href');
    if (href && href.trim()) {
      favicon = resolveUrl(href, baseUrl);
      break;
    }
  }

  // Fallback to default favicon.ico if none found
  if (!favicon) {
    favicon = resolveUrl('/favicon.ico', baseUrl);
  }

  const canonicalHref = $('link[rel="canonical"]').attr('href');

  return {
    title: $('title').text().trim() || '',
    description: getMetaContent($, 'meta[name="description"]'),
    keywords: getMetaContent($, 'meta[name="keywords"]'),
    author: getMetaContent($, 'meta[name="author"]'),
    robots: {
      all: getMetaContent($, 'meta[name="robots"]'),
      googlebot: getMetaContent($, 'meta[name="googlebot"]'),
      bingbot: getMetaContent($, 'meta[name="bingbot"]'),
    },
    viewport: getMetaContent($, 'meta[name="viewport"]'),
    charset: $('meta[charset]').attr('charset') || undefined,
    generator: getMetaContent($, 'meta[name="generator"]'),
    publisher: getMetaContent($, 'meta[name="publisher"]'),
    themeColor: getMetaContent($, 'meta[name="theme-color"]'),
    canonical: canonicalHref ? resolveUrl(canonicalHref, baseUrl) : undefined,
    favicon,
  };
}
