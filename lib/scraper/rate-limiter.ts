interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs; // 1 minute default
    this.maxRequests = maxRequests; // 10 requests per minute default

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private getClientId(request: Request): string {
    // Try to get IP from various headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      // x-forwarded-for can be comma-separated, take the first IP
      return forwarded.split(',')[0].trim();
    }

    return realIp || cfConnectingIp || 'unknown';
  }

  check(request: Request): { allowed: boolean; remaining: number; resetTime: number } {
    const clientId = this.getClientId(request);
    const now = Date.now();
    const resetTime = now + this.windowMs;

    let entry = this.store.get(clientId);

    // If no entry exists or the window has expired, create/reset
    if (!entry || now >= entry.resetTime) {
      entry = { count: 1, resetTime };
      this.store.set(clientId, entry);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }

    // Increment the count
    entry.count++;

    if (entry.count > this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
}

// Create a singleton rate limiter instance
// 10 requests per minute per IP
const rateLimiter = new InMemoryRateLimiter(60000, 60);

export function checkRateLimit(request: Request) {
  return rateLimiter.check(request);
}

export function getRateLimitHeaders(remaining: number, resetTime: number) {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };
}
