import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import redisService from '@/utils/cache/redisCache';
import Redis from 'ioredis';

// Helper function to handle errors
const handleError = (error, context) => {
  if (error instanceof AppError) {
    throw error;
  } else if (error instanceof Error) {
    throw new AppError(context, 500, false, error, true, 'SERVER_ERROR');
  }
  throw new Error(`An unexpected error occurred: ${error}`);
};

// Function to create a refresh record
const createRefreshRecord = async (
  sessionId,
  userId,
  refreshToken,
  redis: Redis | null
) => {
  try {
    if (!prisma) return null;

    const saveRefreshToken = await prisma.sessions.create({
      data: { id: sessionId, userId, token: refreshToken },
    });

    await redisService.set(
      saveRefreshToken.id,
      JSON.stringify(saveRefreshToken),
      redis,
      604800,
      'token'
    );

    return refreshToken;
  } catch (error) {
    handleError(error, 'Error creating refresh record');
  }
};

// Function to get a refresh record
const getRefreshRecord = async (sessionID, redis: Redis | null) => {
  try {
    if (!prisma) return null;

    const cachedRefreshToken = await redisService.get(sessionID, redis);
    if (cachedRefreshToken) {
      const cacheData = JSON.parse(cachedRefreshToken);
      return cacheData.token;
    }

    const refreshToken = await prisma.sessions.findUnique({
      where: { id: sessionID },
    });

    if (!refreshToken) {
      throw new AppError(
        'Refresh token not found',
        404,
        true,
        undefined,
        false,
        'UNAUTHORIZED_SESSION_EXPIRED'
      );
    }

    await redisService.set(
      refreshToken.id,
      refreshToken.token,
      redis,
      604800,
      'token'
    );

    return refreshToken.token;
  } catch (error) {
    handleError(error, 'Error getting refresh record');
  }
};

export { createRefreshRecord, getRefreshRecord };
