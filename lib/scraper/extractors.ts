import * as cheerio from 'cheerio';
import type { BasicMetadata, OpenGraphMetadata, TwitterMetadata, StructuredMetadata, LinkMetadata, OtherMetadata, ImageSource, RawMetadata } from './types';
import { resolveUrl, resolveUrls } from './url-resolver';

export function extractBasicMetadata($: cheerio.CheerioAPI, baseUrl: URL): BasicMetadata {
  const getMetaContent = (selector: string): string | undefined => {
    const content = $(selector).attr('content');
    return content ? content.trim() : undefined;
  };

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

  return {
    title: $('title').text().trim() || '',
    description: getMetaContent('meta[name="description"]'),
    keywords: getMetaContent('meta[name="keywords"]'),
    author: getMetaContent('meta[name="author"]'),
    robots: getMetaContent('meta[name="robots"]'),
    robots_googlebot: getMetaContent('meta[name="googlebot"]'),
    robots_bingbot: getMetaContent('meta[name="bingbot"]'),
    viewport: getMetaContent('meta[name="viewport"]'),
    charset: $('meta[charset]').attr('charset') || undefined,
    generator: getMetaContent('meta[name="generator"]'),
    publisher: getMetaContent('meta[name="publisher"]'),
    theme_color: getMetaContent('meta[name="theme-color"]'),
    favicon,
  };
}

export function extractOpenGraphMetadata($: cheerio.CheerioAPI, baseUrl: URL): OpenGraphMetadata {
  const getMetaContent = (selector: string): string | undefined => {
    const content = $(selector).attr('content');
    return content ? content.trim() : undefined;
  };

  const getAllMetaContent = (selector: string): string[] => {
    return $(selector)
      .map((_, el) => $(el).attr('content') || '')
      .get()
      .filter((content) => content.trim())
      .map((content) => content.trim());
  };

  const ogImages = getAllMetaContent('meta[property="og:image"]');
  const ogLocalesAlt = getAllMetaContent('meta[property="og:locale:alternate"]');
  const ogImageSecure = getAllMetaContent('meta[property="og:image:secure_url"]');
  const ogImageType = getAllMetaContent('meta[property="og:image:type"]');
  const ogSeeAlso = getAllMetaContent('meta[property="og:see_also"]');

  return {
    title: getMetaContent('meta[property="og:title"]'),
    description: getMetaContent('meta[property="og:description"]'),
    type: getMetaContent('meta[property="og:type"]'),
    url: getMetaContent('meta[property="og:url"]'),
    site_name: getMetaContent('meta[property="og:site_name"]'),
    locale: getMetaContent('meta[property="og:locale"]'),
    locale_alternate: ogLocalesAlt,
    images: resolveUrls(ogImages, baseUrl),
    image_secure_url: resolveUrls(ogImageSecure, baseUrl),
    image_type: ogImageType,
    image_width: getMetaContent('meta[property="og:image:width"]'),
    image_height: getMetaContent('meta[property="og:image:height"]'),
    image_alt: getMetaContent('meta[property="og:image:alt"]'),
    audio: getMetaContent('meta[property="og:audio"]'),
    video: getMetaContent('meta[property="og:video"]'),
    determiner: getMetaContent('meta[property="og:determiner"]'),
    updated_time: getMetaContent('meta[property="og:updated_time"]'),
    see_also: resolveUrls(ogSeeAlso, baseUrl),
    article_author: getMetaContent('meta[property="article:author"]'),
    article_published_time: getMetaContent('meta[property="article:published_time"]'),
    article_modified_time: getMetaContent('meta[property="article:modified_time"]'),
    article_section: getMetaContent('meta[property="article:section"]'),
    article_tag: getAllMetaContent('meta[property="article:tag"]'),
  };
}

export function extractTwitterMetadata($: cheerio.CheerioAPI, baseUrl: URL): TwitterMetadata {
  const getMeta = (selector: string): string | undefined => {
    const content = $(selector).attr('content');
    return content ? content.trim() : undefined;
  };

  const getAllMeta = (selector: string): string[] => {
    return $(selector)
      .map((_, el) => $(el).attr('content') || '')
      .get()
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const twitterImages = [
    ...getAllMeta('meta[name="twitter:image"]'),
    ...getAllMeta('meta[property="twitter:image"]'),
    ...getAllMeta('meta[name="twitter:image:src"]'),
    ...getAllMeta('meta[property="twitter:image:src"]'),
  ];

  return {
    card: getMeta('meta[name="twitter:card"], meta[property="twitter:card"]'),
    site: getMeta('meta[name="twitter:site"], meta[property="twitter:site"]'),
    site_id: getMeta('meta[name="twitter:site:id"], meta[property="twitter:site:id"]'),
    creator: getMeta('meta[name="twitter:creator"], meta[property="twitter:creator"]'),
    creator_id: getMeta('meta[name="twitter:creator:id"], meta[property="twitter:creator:id"]'),
    title: getMeta('meta[name="twitter:title"], meta[property="twitter:title"]'),
    description: getMeta('meta[name="twitter:description"], meta[property="twitter:description"]'),
    images: resolveUrls(twitterImages, baseUrl),
    image_alt: getMeta('meta[name="twitter:image:alt"], meta[property="twitter:image:alt"]'),
    app_name_iphone: getMeta('meta[name="twitter:app:name:iphone"]'),
    app_id_iphone: getMeta('meta[name="twitter:app:id:iphone"]'),
    app_name_ipad: getMeta('meta[name="twitter:app:name:ipad"]'),
    app_id_ipad: getMeta('meta[name="twitter:app:id:ipad"]'),
    app_name_googleplay: getMeta('meta[name="twitter:app:name:googleplay"]'),
    app_id_googleplay: getMeta('meta[name="twitter:app:id:googleplay"]'),
  };
}

export function extractStructuredMetadata($: cheerio.CheerioAPI): StructuredMetadata {
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

export function extractLinkMetadata($: cheerio.CheerioAPI, baseUrl: URL): LinkMetadata {
  const canonicalHref = $('link[rel="canonical"]').attr('href');
  return {
    canonical: canonicalHref ? resolveUrl(canonicalHref, baseUrl) : undefined,
  };
}

export function extractOtherMetadata($: cheerio.CheerioAPI, baseUrl: URL): OtherMetadata {
  const getMetaContent = (selector: string): string | undefined => {
    const content = $(selector).attr('content');
    return content ? content.trim() : undefined;
  };

  const tileImageContent = getMetaContent('meta[name="msapplication-TileImage"]');

  return {
    msapplication_tilecolor: getMetaContent('meta[name="msapplication-TileColor"]'),
    msapplication_tileimage: tileImageContent ? resolveUrl(tileImageContent, baseUrl) : undefined,
    language: $('html').attr('lang') || undefined,
    application_name: getMetaContent('meta[name="application-name"]'),
    apple_mobile_web_app_title: getMetaContent('meta[name="apple-mobile-web-app-title"]'),
    apple_mobile_web_app_capable: getMetaContent('meta[name="apple-mobile-web-app-capable"]'),
    apple_mobile_web_app_status_bar_style: getMetaContent('meta[name="apple-mobile-web-app-status-bar-style"]'),
    format_detection: getMetaContent('meta[name="format-detection"]'),
    mobile_web_app_capable: getMetaContent('meta[name="mobile-web-app-capable"]'),
  };
}

export function extractImages($: cheerio.CheerioAPI, baseUrl: URL, ogImages: string[], twitterImages: string[]): ImageSource[] {
  const images: ImageSource[] = [];

  // OG Images
  ogImages.forEach((url) => {
    if (url.trim()) images.push({ url: resolveUrl(url, baseUrl), source: 'og:image' });
  });

  // Twitter Images
  twitterImages.forEach((url) => {
    if (url.trim()) images.push({ url: resolveUrl(url, baseUrl), source: 'twitter:image' });
  });

  // Icon links with enhanced attributes
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel^="apple-touch-icon"], link[rel="mask-icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.trim()) {
      const rel = $(el).attr('rel') || '';
      const source = rel.toLowerCase().includes('apple-touch-icon')
        ? 'apple-touch-icon'
        : rel.toLowerCase().includes('shortcut')
        ? 'shortcut-icon'
        : rel.toLowerCase().includes('mask')
        ? 'mask-icon'
        : 'icon';

      images.push({
        url: resolveUrl(href, baseUrl),
        source: source as ImageSource['source'],
        sizes: $(el).attr('sizes') || undefined,
        type: $(el).attr('type') || undefined,
      });
    }
  });

  // Add default favicon if no icon found
  if (!images.some((i) => (i.source || '').includes('icon'))) {
    images.push({ url: resolveUrl('/favicon.ico', baseUrl), source: 'favicon-default' });
  }

  // Remove duplicates based on URL
  const uniqueImages = images.filter((img, index) => images.findIndex((i) => i.url === img.url) === index);

  return uniqueImages;
}

export function extractRawMetadata($: cheerio.CheerioAPI): RawMetadata {
  const meta = $('meta')
    .map((_, el) => {
      const element = $(el);
      const metaTag: Partial<{ name: string; property: string; content: string; charset: string; httpEquiv: string }> = {};

      const name = element.attr('name');
      const property = element.attr('property');
      const content = element.attr('content');
      const charset = element.attr('charset');
      const httpEquiv = element.attr('http-equiv');

      if (name) metaTag.name = name;
      if (property) metaTag.property = property;
      if (content) metaTag.content = content;
      if (charset) metaTag.charset = charset;
      if (httpEquiv) metaTag.httpEquiv = httpEquiv;

      return metaTag;
    })
    .get()
    .filter((tag) => Object.keys(tag).length > 0);

  return { meta };
}
