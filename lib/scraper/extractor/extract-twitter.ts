import * as cheerio from 'cheerio';
import { resolveUrls } from '../lib/resolve-urls';
import type { TwitterMetadata } from '../types';
import { getAllMetaContent } from './lib/get-all-meta-content';
import { getMetaContent } from './lib/get-meta-content';

export function extractTwitterMetadata($: cheerio.CheerioAPI, baseUrl: URL): TwitterMetadata {
  const twitterImages = [
    ...getAllMetaContent($, 'meta[name="twitter:image"]'),
    ...getAllMetaContent($, 'meta[property="twitter:image"]'),
    ...getAllMetaContent($, 'meta[name="twitter:image:src"]'),
    ...getAllMetaContent($, 'meta[property="twitter:image:src"]'),
  ];

  return {
    card: getMetaContent($, 'meta[name="twitter:card"], meta[property="twitter:card"]'),
    site: getMetaContent($, 'meta[name="twitter:site"], meta[property="twitter:site"]'),
    siteId: getMetaContent($, 'meta[name="twitter:site:id"], meta[property="twitter:site:id"]'),
    creator: getMetaContent($, 'meta[name="twitter:creator"], meta[property="twitter:creator"]'),
    creatorId: getMetaContent($, 'meta[name="twitter:creator:id"], meta[property="twitter:creator:id"]'),
    title: getMetaContent($, 'meta[name="twitter:title"], meta[property="twitter:title"]'),
    description: getMetaContent($, 'meta[name="twitter:description"], meta[property="twitter:description"]'),
    images: resolveUrls(twitterImages, baseUrl),
    imageAlt: getMetaContent($, 'meta[name="twitter:image:alt"], meta[property="twitter:image:alt"]'),
    appNameIphone: getMetaContent($, 'meta[name="twitter:app:name:iphone"]'),
    appIdIphone: getMetaContent($, 'meta[name="twitter:app:id:iphone"]'),
    appNameIpad: getMetaContent($, 'meta[name="twitter:app:name:ipad"]'),
    appIdIpad: getMetaContent($, 'meta[name="twitter:app:id:ipad"]'),
    appNameGoogleplay: getMetaContent($, 'meta[name="twitter:app:name:googleplay"]'),
    appIdGoogleplay: getMetaContent($, 'meta[name="twitter:app:id:googleplay"]'),
  };
}
