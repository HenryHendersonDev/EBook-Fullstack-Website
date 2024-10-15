import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import { User, Sessions } from '@prisma/client';
import Redis from 'ioredis';
import redisService from '@/utils/cache/redisCache';

interface Register {
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
  filePath: string | null;
  imagePublicID?: string | null;
}

const findUserOnDB = async (email: string): Promise<User | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const isUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    return isUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Finding',
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

const findUserOnDBviaSessionID = async (
  id: string,
  redis: Redis | null
): Promise<Sessions | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const cashedSession = await redisService.get(id, redis);
    if (cashedSession) {
      const sessionData: Sessions = JSON.parse(cashedSession);
      return sessionData;
    }
    const Session = await prisma.sessions.findUnique({
      where: {
        id,
      },
    });
    if (Session) {
      const stringSession = JSON.stringify(Session);
      await redisService.set(id, stringSession, redis, 1800, 'session');
    }
    return Session;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Finding New Using Using Sesion ID',
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

const findUserOnDBViaID = async (id: string): Promise<User | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const isUser = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return isUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Finding user Using UserID',
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

interface PublicDATA {
  email: string;
  firstName: string;
  lastName: string | null;
}

const findUserOnDBViaIdPUBLIC_DATA = async (
  id: string
): Promise<PublicDATA | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const isUser = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return isUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Finding User PUBLIC Data',
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

export {
  findUserOnDB,
  findUserOnDBviaSessionID,
  findUserOnDBViaID,
  findUserOnDBViaIdPUBLIC_DATA,
};
