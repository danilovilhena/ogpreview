interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const createRateLimiter = (windowMs: number = 60000, maxRequests: number = 10) => {
  const store = new Map<string, RateLimitEntry>();

  // Removes expired rate limit entries from the store to prevent memory leaks
  // This runs periodically to clean up entries where the time window has passed
  const cleanup = (store: Map<string, RateLimitEntry>) => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }
  };

  // Extracts client identifier from request headers for rate limiting
  // Prioritizes x-forwarded-for (proxy/load balancer), then x-real-ip, then cf-connecting-ip (Cloudflare)
  // Falls back to 'unknown' if no IP can be determined - this ensures rate limiting still works
  const getClientId = (request: Request): string => {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2), we want the original client
      return forwarded.split(',')[0].trim();
    }

    return realIp || cfConnectingIp || 'unknown';
  };

  const check = (request: Request): { allowed: boolean; remaining: number; resetTime: number } => {
    const clientId = getClientId(request);
    const now = Date.now();
    const resetTime = now + windowMs;

    let entry = store.get(clientId);

    if (!entry || now >= entry.resetTime) {
      entry = { count: 1, resetTime };
      store.set(clientId, entry);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime,
      };
    }

    entry.count++;

    if (entry.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };

  setInterval(() => cleanup(store), 5 * 60 * 1000);

  return { check };
};

const rateLimiter = createRateLimiter(60000, 60);

export function checkRateLimit(request: Request) {
  const result = rateLimiter.check(request);

  const headers = {
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetTime: result.resetTime,
    headers,
    error: result.allowed ? null : { error: 'Rate limit exceeded. Please try again later.' },
    errorBody: result.allowed ? null : { status: 429, headers },
  };
}
