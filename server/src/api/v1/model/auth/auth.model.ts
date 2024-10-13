import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from '@prisma/client';

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

export { saveNewUserOnDB, findUserOnDB };
