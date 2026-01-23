import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';

/**
 * Simple Redis-backed sliding-window rate limiter.
 * Limits each IP to MAX_REQUESTS inside a rolling WINDOW.
 */
export function rateLimiter() {
  const windowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = await getRedisClient();
      const key = `rl:${req.ip}`;

      const current = await redis.incr(key);
      if (current === 1) {
        // First request in window — set the TTL
        await redis.expire(key, windowSeconds);
      }

      // Attach headers so clients can see their quota
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
        return;
      }

      next();
    } catch (err) {
      // If Redis is down, let the request through rather than breaking the app
      next();
    }
  };
}
