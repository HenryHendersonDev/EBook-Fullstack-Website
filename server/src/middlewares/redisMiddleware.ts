import { Request, Response, NextFunction } from 'express';
import redisClient from '@/config/redisConfig';
import colors from 'colors';
import { APPLICATION_CONFIG } from '@/config/applicationConfig';

const setRedis =
  () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (APPLICATION_CONFIG.REDIS_CACHE) {
        const client = await redisClient(); // Get Redis client
        req.redis = client; // Attach Redis client to the request object
      } else {
        req.redis = null; // Caching is disabled
      }
    } catch (error) {
      console.error(
        colors.yellow(
          'Warning: Redis server not available. Falling back to in-memory rate limit.'
        )
      );
      req.redis = null; // Ensure Redis is null on error
    }

    return next(); // Proceed to the next middleware
  };

export default setRedis;
