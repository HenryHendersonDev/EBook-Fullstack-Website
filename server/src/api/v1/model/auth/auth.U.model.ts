import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from '@prisma/client';
import Redis from 'ioredis';
import redisService from '@/utils/cache/redisCache';

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
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new AppError(
          'User Not Found',
          404,
          true,
          undefined,
          false,
          'USER_NOT_FOUND'
        );
      }
    } else if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Setting user new Password',
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

const UpdateUserFirstName = async (
  firstName: string,
  id: string
): Promise<User | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const newUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        firstName,
      },
    });

    return newUser;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new AppError(
          'User Not Found',
          404,
          true,
          undefined,
          false,
          'USER_NOT_FOUND'
        );
      }
    } else if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Updating User First name',
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

const UpdateUserLastName = async (
  lastName: string,
  id: string
): Promise<User | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const newUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        lastName,
      },
    });
    return newUser;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new AppError(
          'User Not Found',
          404,
          true,
          undefined,
          false,
          'USER_NOT_FOUND'
        );
      }
    } else if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Updating User Last name',
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

const UpdateUserFullName = async (
  firstName: string,
  lastName: string,
  id: string
): Promise<User | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const newUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        firstName,
        lastName,
      },
    });
    return newUser;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new AppError(
          'User Not Found',
          404,
          true,
          undefined,
          false,
          'USER_NOT_FOUND'
        );
      }
    } else if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Updating User Both First and last Names',
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
  setNewPassword,
  UpdateUserFirstName,
  UpdateUserLastName,
  UpdateUserFullName,
};
