import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import Redis from 'ioredis';
import redisService from '@/utils/cache/redisCache';

const saveOTPonDB = async (
  userId: string,
  otp: string,
  redis: Redis | null
): Promise<boolean> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const newOTP = await prisma.oTP.create({
      data: {
        userId,
        otp,
      },
    });
    if (!newOTP) {
      throw new AppError(
        'Something Went Wrong While Saving The OTP',
        500,
        false,
        undefined,
        false,
        'SYSTEM_ERROR'
      );
    }
    await redisService.set(newOTP.otp, newOTP.userId, redis, 60 * 5, 'otp');
    return true;
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
        'Something went Wrong While Saving The OTP code on The Database',
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
export { saveOTPonDB };
