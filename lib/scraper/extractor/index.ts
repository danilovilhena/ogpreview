import * as cheerio from 'cheerio';
import { cleanObject } from '../lib/clean-object';
import { ScrapedMetadata } from '../types';
import { extractBasicMetadata } from './extract-basic';
import { extractJsonLd } from './extract-json-ld';
import { extractOpenGraphMetadata } from './extract-open-graph';
import { extractRawMetadata } from './extract-raw';
import { extractTwitterMetadata } from './extract-twitter';

export function extractMetadata(html: string, baseUrl: URL): ScrapedMetadata {
  const $ = cheerio.load(html);

  const basic = extractBasicMetadata($, baseUrl);
  const openGraph = extractOpenGraphMetadata($, baseUrl);
  const twitter = extractTwitterMetadata($, baseUrl);
  const jsonLd = extractJsonLd($);
  const raw = extractRawMetadata($);

  const metadata: ScrapedMetadata = {
    basic,
    openGraph,
    twitter,
    jsonLd: jsonLd.jsonLd,
    raw: raw.raw,
  };

  cleanObject(metadata);
  return metadata;
}
