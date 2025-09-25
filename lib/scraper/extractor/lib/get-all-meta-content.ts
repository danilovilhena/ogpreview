import * as cheerio from 'cheerio';

export const getAllMetaContent = ($: cheerio.CheerioAPI, selector: string): string[] => {
  return $(selector)
    .map((_, el) => $(el).attr('content') || '')
    .get()
    .filter((content) => content.trim())
    .map((content) => content.trim())
    .filter(Boolean);
};
