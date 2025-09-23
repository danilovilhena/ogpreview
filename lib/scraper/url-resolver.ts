export function resolveUrl(url: string, baseUrl: URL): string {
  if (!url) return "";

  try {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("//")) return `${baseUrl.protocol}${url}`;
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

export function resolveUrls(urls: string[], baseUrl: URL): string[] {
  return urls.map((url) => resolveUrl(url, baseUrl));
}
