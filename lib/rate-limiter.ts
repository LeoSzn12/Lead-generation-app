/**
 * Rate limiting utilities for API endpoints
 * Uses in-memory token bucket algorithm
 */

interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed for given key
   */
  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      // Create new bucket
      bucket = {
        tokens: this.config.maxRequests - 1,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
      
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetAt: new Date(now + this.config.windowMs),
      };
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const refillAmount = Math.floor(timePassed / this.config.windowMs) * this.config.maxRequests;
    
    if (refillAmount > 0) {
      bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + refillAmount);
      bucket.lastRefill = now;
    }

    // Check if tokens available
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetAt: new Date(bucket.lastRefill + this.config.windowMs),
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(bucket.lastRefill + this.config.windowMs),
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clean up old buckets (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const expireTime = this.config.windowMs * 2;

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > expireTime) {
        this.buckets.delete(key);
      }
    }
  }
}

// Rate limit configurations for different tiers
export const RATE_LIMITS = {
  free: {
    maxRequests: 10, // 10 requests
    windowMs: 60 * 60 * 1000, // per hour
  },
  pro: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000,
  },
  business: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000,
  },
};

// Create rate limiters for each tier
const rateLimiters = {
  free: new RateLimiter(RATE_LIMITS.free),
  pro: new RateLimiter(RATE_LIMITS.pro),
  business: new RateLimiter(RATE_LIMITS.business),
};

/**
 * Check rate limit for a user/workspace
 */
export async function checkRateLimit(
  identifier: string,
  tier: 'free' | 'pro' | 'business' = 'free'
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limiter = rateLimiters[tier];
  return limiter.checkLimit(identifier);
}

/**
 * Reset rate limit for a user/workspace
 */
export function resetRateLimit(identifier: string, tier: 'free' | 'pro' | 'business' = 'free'): void {
  const limiter = rateLimiters[tier];
  limiter.reset(identifier);
}

/**
 * Cleanup old rate limit buckets (run periodically)
 */
export function cleanupRateLimits(): void {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 60 * 60 * 1000);
}
