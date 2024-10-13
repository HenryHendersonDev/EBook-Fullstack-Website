import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';

interface IRedisService {
  set: (
    key: string,
    value: string,
    redis: Redis | null,
    expireTime: number,
    tag?: 'token' | 'session' | 'otp'
  ) => Promise<boolean | null>;
  get: (key: string, redis: Redis | null) => Promise<string | null>;
  delete: (key: string, redis: Redis | null) => Promise<boolean | void>;
}

class RedisService implements IRedisService {
  async set(
    key: string,
    value: string,
    redis: Redis | null,
    expireTime: number,
    tag?: 'token' | 'session' | 'otp'
  ): Promise<boolean | null> {
    try {
      if (!redis) {
        return null;
      }
      await redis.set(key, value, 'EX', expireTime);
      if (tag) {
        await redis.sadd(tag, key);
      }
      return true;
    } catch (error) {
      throw new AppError(
        'Error setting cache',
        500,
        true,
        error,
        true,
        'SERVER_ERROR'
      );
    }
  }
  async get(key: string, redis: Redis | null): Promise<string | null> {
    try {
      if (!redis) {
        return null;
      }
      const cachedValue = await redis.get(key);
      if (!cachedValue) return null;
      return cachedValue;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(
          'Error getting cache',
          500,
          true,
          error,
          true,
          'SERVER_ERROR'
        );
      }
    }
  }
  async delete(key: string, redis: Redis | null): Promise<boolean | void> {
    try {
      if (!redis) {
        return;
      }
      await redis.del(key);
      return true;
    } catch (error) {
      throw new AppError(
        'Error deleting cache',
        500,
        true,
        error,
        true,
        'SERVER_ERROR'
      );
    }
  }
}

const redisService = new RedisService();

export default redisService;
