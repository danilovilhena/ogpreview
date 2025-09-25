/**
 * Normalize and validate a URL for scraping
 */
export function normalizeUrl(url: string): { success: true; url: URL } | { success: false; error: string } {
  try {
    const targetUrl = new URL(url?.includes('http') ? url : `https://${url}`);
    // Clear query parameters
    targetUrl.search = '';

    // Remove www. prefix to prevent duplicates
    if (targetUrl.hostname.startsWith('www.')) {
      targetUrl.hostname = targetUrl.hostname.substring(4);
    }

    return { success: true, url: targetUrl };
  } catch {
    return { success: false, error: 'Invalid URL format' };
  }
}
