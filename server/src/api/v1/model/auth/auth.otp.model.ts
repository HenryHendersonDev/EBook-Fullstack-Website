import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import redisService from '@/utils/cache/redisCache';

const findOTPCode = async (
  userId: string,
  otp: string,
  redis: Redis | null
): Promise<boolean | null> => {
  try {
    if (!prisma) throw new Error('Prisma client is not initialized');
    const otpCode = await redisService.get(otp, redis);
    if (otpCode && otpCode === userId) return true;
    const otpPrisma = await prisma.oTP.findUnique({
      where: {
        userId,
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
        'Something went Wrong While Finding OTP CODE',
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

export { findOTPCode };
