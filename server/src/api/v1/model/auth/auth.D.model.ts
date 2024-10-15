import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import redisService from '@/utils/cache/redisCache';

const deleteSession = async (
  id: string,
  redis: Redis | null
): Promise<boolean | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const deleteSession = await prisma.sessions.delete({
      where: {
        id,
      },
    });
    await redisService.delete(id, redis);
    if (!deleteSession) return null;
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Deleting',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

const deleteUser = async (
  userId: string,
  redis: Redis | null
): Promise<boolean | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const allSessions = await prisma.sessions.findMany({
      where: {
        userId,
      },
    });
    allSessions.forEach(async (session) => {
      await redisService.delete(session.id, redis);
    });
    await prisma.sessions.deleteMany({
      where: {
        userId,
      },
    });
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Deleting',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

export { deleteSession, deleteUser };
