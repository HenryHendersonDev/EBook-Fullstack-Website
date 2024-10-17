import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import redisService from '@/utils/cache/redisCache';
import handleError from '@/utils/errorHandle';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import Redis from 'ioredis';

interface Register {
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
  filePath: string | null;
  imagePublicID?: string | null;
}

interface IUserCreateModel {
  createNewUserInDatabase(data: Register): Promise<string>;
  createNewOtpCode(
    userId: string,
    otp: string,
    redis: Redis | null
  ): Promise<boolean>;
}

/**
 *
 *
 * Purpose: for Finding information from Database
 *
 * Context: This Class we will do Some Creating Tasks on Database
 *
 *
 */

class UserCreateModel implements IUserCreateModel {
  /**
   *
   * Purpose: creating New user on Database
   *
   * Context: we will use user Email,Password,First Name, Last Name and Image then save those data on the Database
   *
   * Returns: user id String
   *
   */

  async createNewUserInDatabase(data: Register): Promise<string> {
    try {
      const { id } = await prisma.user.create({
        data: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          profileImage: data.filePath,
          imagePublicID: data.imagePublicID,
        },
      });
      return id;
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
      }
      return handleError(error, ' creating New user');
    }
  }
  /**
   *
   * Purpose: Creating new OTP code
   *
   * Context: We Will Create new given OTP code on user database.
   *
   * Returns: Boolean
   *
   */

  async createNewOtpCode(
    userId: string,
    otp: string,
    redis: Redis | null
  ): Promise<boolean> {
    try {
      const newCreatedOTP = await prisma.oTP.create({
        data: {
          userId,
          otp,
        },
      });
      await redisService.set(
        newCreatedOTP.otp,
        newCreatedOTP.userId,
        redis,
        60 * 5,
        'otp'
      );
      return true;
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
      }
      return handleError(error, ' creating New user');
    }
  }
}

/**
 *
 *
 * Purpose: for Finding information from Database
 *
 * Context: This Class we will do Some Creating Tasks on Database
 *
 *
 */

const userCreateModel = new UserCreateModel();

export default userCreateModel;
