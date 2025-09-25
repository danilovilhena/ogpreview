import * as cheerio from 'cheerio';

export const getMetaContent = ($: cheerio.CheerioAPI, selector: string): string | undefined => {
  const content = $(selector).attr('content');
  return content ? content.trim() : undefined;
};
