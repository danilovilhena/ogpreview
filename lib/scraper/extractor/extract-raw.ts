import * as cheerio from 'cheerio';
import type { RawMetadata } from '../types';

export function extractRawMetadata($: cheerio.CheerioAPI): RawMetadata {
  const raw = $('meta')
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

  return { raw };
}
