import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import AppError from '@/models/AppErrorModel';
import _ from 'lodash';

// Duration type for rate limiting
type Duration =
  | '1m'
  | '2m'
  | '3m'
  | '4m'
  | '5m'
  | '10m'
  | '15m'
  | '30m'
  | '1h'
  | '3h'
  | '6h'
  | '12h'
  | '1d';

// Type alias for points
export type Points = number;

// Create a mapping of durations to their corresponding values in seconds
const durationMap: Map<Duration, number> = new Map<Duration, number>([
  ['1m', 60],
  ['2m', 120],
  ['3m', 180],
  ['4m', 240],
  ['5m', 300],
  ['10m', 600],
  ['15m', 900],
  ['30m', 1800],
  ['1h', 3600],
  ['3h', 10800],
  ['6h', 21600],
  ['12h', 43200],
  ['1d', 86400],
]);

const createRateLimiterMiddleware = (points: Points, duration: Duration) => {
  const durationValue = durationMap.get(duration) ?? 300;

  let rateLimiter: RateLimiterMemory | RateLimiterRedis = new RateLimiterMemory(
    {
      points,
      duration: durationValue,
    }
  );

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { redis, ip } = req;

      if (redis) {
        rateLimiter = new RateLimiterRedis({
          storeClient: redis,
          points,
          duration: durationValue,
        });
      }

      if (!ip) {
        return next(
          new Error('IP address is not available on the request object.')
        );
      }

      rateLimiter
        .consume(ip)
        .then((rateLimiterRes) => {
          res.set({
            'X-RateLimit-Limit': points.toString(),
            'X-RateLimit-Remaining': rateLimiterRes.remainingPoints.toString(),
            'X-RateLimit-Reset': new Date(
              Date.now() + rateLimiterRes.msBeforeNext
            ).toISOString(),
          });
          next();
        })
        .catch(() => {
          res.status(429).send('Too Many Requests');
        });
    } catch (error) {
      if (error instanceof AppError) {
        return next();
      }
      return next(error);
    }
  };
};

export default createRateLimiterMiddleware;
