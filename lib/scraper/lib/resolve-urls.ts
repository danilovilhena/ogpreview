import { resolveUrl } from './resolve-url';

export const resolveUrls = (urls: string[], baseUrl: URL): string[] => {
  return urls.map((url) => resolveUrl(url, baseUrl));
};
