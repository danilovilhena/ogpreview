import * as cheerio from 'cheerio';
import { resolveUrls } from '../lib/resolve-urls';
import type { OpenGraphMetadata } from '../types';
import { getMetaContent } from './lib/get-meta-content';
import { getAllMetaContent } from './lib/get-all-meta-content';

export function extractOpenGraphMetadata($: cheerio.CheerioAPI, baseUrl: URL): OpenGraphMetadata {
  const ogImages = getAllMetaContent($, 'meta[property="og:image"]');
  const ogLocalesAlt = getAllMetaContent($, 'meta[property="og:locale:alternate"]');
  const ogImageSecure = getAllMetaContent($, 'meta[property="og:image:secure_url"]');
  const ogImageType = getAllMetaContent($, 'meta[property="og:image:type"]');
  const ogSeeAlso = getAllMetaContent($, 'meta[property="og:see_also"]');

  return {
    title: getMetaContent($, 'meta[property="og:title"]'),
    description: getMetaContent($, 'meta[property="og:description"]'),
    type: getMetaContent($, 'meta[property="og:type"]'),
    url: getMetaContent($, 'meta[property="og:url"]'),
    siteName: getMetaContent($, 'meta[property="og:site_name"]'),
    locale: getMetaContent($, 'meta[property="og:locale"]'),
    localeAlternate: ogLocalesAlt,
    images: resolveUrls(ogImages, baseUrl),
    imageSecureUrl: resolveUrls(ogImageSecure, baseUrl),
    imageType: ogImageType,
    imageWidth: getMetaContent($, 'meta[property="og:image:width"]'),
    imageHeight: getMetaContent($, 'meta[property="og:image:height"]'),
    imageAlt: getMetaContent($, 'meta[property="og:image:alt"]'),
    audio: getMetaContent($, 'meta[property="og:audio"]'),
    video: getMetaContent($, 'meta[property="og:video"]'),
    determiner: getMetaContent($, 'meta[property="og:determiner"]'),
    updatedTime: getMetaContent($, 'meta[property="og:updated_time"]'),
    seeAlso: resolveUrls(ogSeeAlso, baseUrl),
    articleAuthor: getMetaContent($, 'meta[property="article:author"]'),
    articlePublishedTime: getMetaContent($, 'meta[property="article:published_time"]'),
    articleModifiedTime: getMetaContent($, 'meta[property="article:modified_time"]'),
    articleSection: getMetaContent($, 'meta[property="article:section"]'),
    articleTag: getAllMetaContent($, 'meta[property="article:tag"]'),
  };
}
