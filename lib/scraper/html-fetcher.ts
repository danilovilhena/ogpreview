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

// Rotate between different realistic user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function buildClient() {
  return ky.create({
    // More aggressive retry for 403s and 429s
    retry: {
      limit: 4, // Increased from 2
      methods: ['get'],
      statusCodes: [403, 408, 429, 500, 502, 503, 504], // Added 403
      backoffLimit: 8000, // Increased from 2000ms to 8000ms
      delay: (attemptCount) => {
        // Exponential backoff with jitter (500ms, 1s, 2s, 4s + random)
        const baseDelay = Math.min(500 * Math.pow(2, attemptCount - 1), 8000);
        const jitter = Math.random() * 1000; // Add up to 1s of random jitter
        return baseDelay + jitter;
      },
    },
    timeout: 45000, // Increased from 30s
    headers: {
      'User-Agent': getRandomUserAgent(),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      DNT: '1',
    },
    redirect: 'manual', // we'll follow redirects manually to re-run SSRF guards
    hooks: {
      beforeRetry: [
        async ({ error, retryCount }) => {
          console.log(`Retry ${retryCount} for request due to:`, error.message);

          // Add a small random delay before retry to avoid thundering herd
          const delay = Math.random() * 2000 + 1000; // 1-3 seconds
          await new Promise((resolve) => setTimeout(resolve, delay));
        },
      ],
    },
  });
}

export async function fetchHtml(startUrl: URL): Promise<string> {
  // Create a new client for each request to get fresh user agent rotation
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

  // Special handling for 403 - try once more with a different approach
  if (response.status === 403) {
    console.log('Got 403, trying with minimal headers...');

    // Try again with minimal headers to bypass some bot detection
    const minimalClient = ky.create({
      timeout: 45000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'manual',
    });

    // Add a longer delay before the fallback attempt
    await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));

    try {
      response = await minimalClient.get(current.toString(), { throwHttpErrors: false });
    } catch (fallbackError) {
      console.log('Fallback attempt failed:', fallbackError);
      // Continue with original error handling
    }
  }

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
