import { Request, Response, NextFunction } from 'express';
import redisClient from '@/config/redisConfig';
import colors from 'colors';
import { APPLICATION_CONFIG } from '@/config/applicationConfig';

const setRedis =
  () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (APPLICATION_CONFIG.REDIS_CACHE) {
        const client = await redisClient();
        req.redis = client;
      } else {
        req.redis = null;
      }
    } catch (error) {
      console.error(
        colors.yellow(
          'Warning: Redis server not available. Falling back to in-memory rate limit.'
        )
      );
      req.redis = null;
    }

    return next();
  };

export default setRedis;
