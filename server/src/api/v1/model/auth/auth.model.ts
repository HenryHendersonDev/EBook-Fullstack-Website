import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
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

const saveNewUserOnDB = async (user: Register): Promise<string> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.filePath,
        imagePublicID: user.imagePublicID,
      },
    });
    return newUser.id;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new AppError(
          'A user with this email already exists. Please use a different email and try again.',
          409,
          true,
          undefined,
          false,
          'UNIQUE_CONSTRAINT_FAILED'
        );
      }
    } else if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Saving New User',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

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
        'Something went Wrong While Saving New User',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

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
        'Something went Wrong While Saving New User',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
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
        'Something went Wrong While Saving New User',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
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
        'Something went Wrong While Saving New User',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

const setNewPassword = async (
  id: string,
  password: string,
  redis: Redis | null
): Promise<User | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
      },
    });
    if (!user) {
      throw new AppError(
        'User Not Found',
        404,
        true,
        undefined,
        false,
        'USER_NOT_FOUND'
      );
    }
    const allSessions = await prisma.sessions.findMany({
      where: {
        userId: user.id,
      },
    });
    allSessions.forEach(async (session) => {
      await redisService.delete(session.id, redis);
    });
    await prisma.sessions.deleteMany({
      where: {
        userId: user.id,
      },
    });
    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Saving New User',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

const findOTPCode = async (
  id: string,
  otp: string,
  redis: Redis | null
): Promise<boolean | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const otpCode = await redisService.get(otp, redis);
    if (otpCode && otpCode === id) return true;
    const otpPrisma = await prisma.oTP.findUnique({
      where: {
        userId: id,
        otp,
      },
    });
    if (!otpPrisma) return null;
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Saving New User',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

export {
  saveNewUserOnDB,
  findUserOnDB,
  deleteSession,
  findUserOnDBviaSessionID,
  findUserOnDBViaID,
  setNewPassword,
  findOTPCode,
};
