import Redis from 'ioredis';
import colors from 'colors';
import AppError from '@/models/AppErrorModel';
import { APPLICATION_CONFIG } from '@/config/applicationConfig';

const redisUrl = process.env['REDIS_SERVER'];
let Rc: Redis | null = null;

const RedisConfig = {
  enableOfflineQueue: true,
  connectTimeout: 5000,
  retryStrategy: (times: number) => {
    if (times >= 3) {
      return null;
    }
    return 100;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  // tls: {
  //   rejectUnauthorized: false,
  // },
  db: 0,
  family: 4,
};

if (redisUrl && APPLICATION_CONFIG.REDIS_CACHE) {
  Rc = new Redis(redisUrl, RedisConfig);
  Rc.on('error', (err) => {
    if (err.message.includes('ETIMEDOUT')) {
      console.log(colors.yellow(`Redis connection timed out: ${err.message}`));
    }
  });
}

/**
 *
 * @returns Redis
 */

const redisClient = async (): Promise<Redis> => {
  try {
    if (!APPLICATION_CONFIG.REDIS_CACHE) {
      console.log(
        'Redis Not Allowed To Use On Application Config. Caching Not working'
      );
    }
    if (!redisUrl) {
      throw new AppError(
        'Redis server URL not provided',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }
    if (!Rc) {
      throw new AppError(
        'Redis is Not Set',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }
    await Rc.ping();

    if (Rc.status !== 'ready') {
      throw new AppError(
        "Redis connection isn't Ready",
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }

    return Rc;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'An unexpected error occurred while interacting with the Redis client.',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred : ${error}`);
  }
};

export default redisClient;
