interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

export class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      blockDurationMs: 60000, // 1 minute default
      ...config
    };

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.storage.delete(key);
      }
    }
  }

  public check(identifier: string): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    // Check if still blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }

    // Initialize or reset if window expired
    if (!entry || entry.resetTime <= now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      this.storage.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      entry.blockedUntil = now + (this.config.blockDurationMs || 60000);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  public reset(identifier: string) {
    this.storage.delete(identifier);
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
    this.storage.clear();
  }
}

// Predefined rate limiters for different operations
export const rateLimiters = {
  // Authentication attempts
  auth: new RateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  }),

  // API calls per user
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 60 * 1000 // 1 minute
  }),

  // File uploads
  upload: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  }),

  // Email sending
  email: new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000 // 10 minutes
  }),

  // Database operations
  database: new RateLimiter({
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 2 * 60 * 1000 // 2 minutes
  })
};

// Hook for using rate limiter in React components
export const useRateLimit = (limiter: RateLimiter, identifier: string) => {
  const checkLimit = () => {
    return limiter.check(identifier);
  };

  const resetLimit = () => {
    limiter.reset(identifier);
  };

  return { checkLimit, resetLimit };
};

// Middleware function for API calls
export const withRateLimit = (limiter: RateLimiter, identifier: string) => {
  return <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const result = limiter.check(identifier);
      
      if (!result.allowed) {
        const error = new Error(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`);
        (error as any).code = 'RATE_LIMIT_EXCEEDED';
        (error as any).retryAfter = result.retryAfter;
        throw error;
      }

      return fn(...args);
    }) as T;
  };
};