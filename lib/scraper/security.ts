import ky, { TimeoutError } from 'ky';
import { lookup } from 'node:dns/promises';

const MAX_BYTES = 10_000_000; // ~10MB cap for HTML
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// Helper: determine if an IP is private or special
function isPrivateIp(ip: string): boolean {
  // IPv4 checks
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const oct = ip.split('.').map((n) => parseInt(n, 10));
    const [a, b] = oct;
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    // loopback 127.0.0.0/8
    if (a === 127) return true;
    // link-local 169.254.0.0/16
    if (a === 169 && b === 254) return true;
  }
  // IPv6 checks (loopback, link-local, unique local fc00::/7)
  if (ip.includes(':')) {
    const lo = '::1';
    if (ip === lo) return true;
    if (ip.toLowerCase().startsWith('fe80:')) return true; // link-local
    const first = parseInt(ip.split(':')[0], 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  }
  return false;
}

async function resolveAndGuard(u: URL): Promise<void> {
  // Only http/https
  if (!ALLOWED_PROTOCOLS.has(u.protocol)) {
    throw new Error('Only http/https URLs are allowed.');
  }

  const host = u.hostname;

  // DNS lookup (A/AAAA). Multiple answers possible; all must be public.
  const res = await lookup(host, { all: true, verbatim: true });
  if (!res.length) throw new Error('Could not resolve host.');

  for (const { address } of res) {
    if (isPrivateIp(address)) {
      throw new Error('Target resolves to a private address (blocked).');
    }
  }
}

function buildClient() {
  return ky.create({
    // Retry 429/5xx with exponential backoff, respect Retry-After if provided
    retry: {
      limit: 2,
      methods: ['get'],
      statusCodes: [408, 429, 500, 502, 503, 504],
      backoffLimit: 2000,
    },
    timeout: 30000,
    headers: {
      // Friendly, identifiable UA
      'User-Agent': 'Mozilla/5.0 (compatible; OGPreview/1.0; +https://ogpreview.co)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
    },
    redirect: 'manual', // we'll follow redirects manually to re-run SSRF guards
    hooks: {
      beforeRetry: [
        async ({ error }) => {
          // Could add jitter logging/metrics here
          console.log('Retrying request due to error:', error.message);
        },
      ],
    },
  });
}

export async function guardedFetchHtml(startUrl: URL): Promise<string> {
  const client = buildClient();

  // Follow up to N redirects, re-checking each target
  const MAX_REDIRECTS = 5;
  let current = startUrl;
  let response: Response | undefined;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await resolveAndGuard(current);

    response = await client.get(current.toString(), { throwHttpErrors: false });

    // Handle redirects manually to re-guard the next hop
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const loc = response.headers.get('location');
      if (!loc) break;
      const next = new URL(loc, current);
      current = next;
      continue;
    }
    break;
  }

  if (!response) throw new Error('No response received.');
  if (response.status >= 400) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const ct = response.headers.get('content-type') || '';
  if (!/\btext\/html\b/i.test(ct)) {
    throw new Error(`Unsupported content-type: ${ct || 'unknown'}`);
  }

  // Enforce size limit using a reader
  const reader = (response as Response & { body?: ReadableStream }).body?.getReader?.();
  if (!reader) {
    // Fallback to .text() if no reader (rare)
    const text = await response.text();
    if (text.length > MAX_BYTES) throw new Error('Response too large.');
    return text;
  }

  const decoder = new TextDecoder(); // will assume UTF-8
  let received = 0;
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BYTES) {
      reader.cancel();
      throw new Error('Response too large.');
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join('');
}

export function handleScrapingError(error: unknown) {
  // ky specific errors
  if (error instanceof TimeoutError) {
    return { error: 'Upstream timed out', status: 504 };
  }
  if (error && typeof error === 'object' && 'name' in error && error.name === 'HTTPError' && 'response' in error) {
    const r = error.response as Response;
    return {
      error: `Upstream error: ${r.status} ${r.statusText}`,
      status: r.status >= 500 ? 502 : 400,
    };
  }

  // Known guard errors
  const msg = error instanceof Error ? error.message : 'Internal server error during scraping';
  const status =
    msg.includes('private address') || msg.includes('Only http/https')
      ? 400
      : msg.includes('resolve host')
      ? 400
      : msg.includes('content-type')
      ? 415
      : msg.includes('too large')
      ? 413
      : 500;

  return { error: msg, status };
}
