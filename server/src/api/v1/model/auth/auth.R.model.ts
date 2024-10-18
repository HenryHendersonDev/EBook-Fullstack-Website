import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import { User, Sessions } from '@prisma/client';
import Redis from 'ioredis';
import redisService from '@/utils/cache/redisCache';
import handleError from '@/utils/errorHandle';
import { isValidDate } from '@/utils/time';

interface UserPublicData {
  email: string;
  firstName: string;
  lastName: string | null;
}

interface IUserReadModel {
  findUserInDatabase(data: { email?: string; userID?: string }): Promise<User>;
  findUserPublicDataInDatabase(userID: string): Promise<UserPublicData>;
  findUserBySessionIdInDatabase(
    sessionID: string,
    redis: Redis | null
  ): Promise<Sessions>;
  retrieveOTPCode(
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
 * Context: Using some different information we will return some specific data. this is used for get some information from the Database.
 * Supported Functions:
 * - findUserInDatabase: Retrieves a user by email or user ID.
 * - findUserPublicDataInDatabase: Retrieves public data for a specific user ID.
 * - findUserBySessionIdInDatabase: Retrieves session information for a user by session ID.
 * - retrieveOTPCode: for getting the OTP code from Database
 *
 * Returns: User Object if found in the Database.
 *
 *
 */
class UserReadModel implements IUserReadModel {
  /**
   *
   *
   * Purpose: Async Find User in The Database
   *
   * Context: Using User Email or user Id check on the Database if We have a User.
   *  @param {string} [email] : User email address. optional But required if you not provide User ID
   *  @param {string} [userID] : User ID. optional But required if you not provide email address
   * You Should Give Email or userID. ony one is required
   *
   * Returns: <User> Object if found in the Database.
   *
   *
   */

  async findUserInDatabase({
    email,
    userID,
  }: {
    email?: string;
    userID?: string;
  }): Promise<User> {
    try {
      if (email) {
        const isUser = await prisma.user.findUnique({
          where: {
            email,
          },
        });
        if (!isUser) {
          throw new AppError(
            'User Not Found',
            404,
            true,
            undefined,
            false,
            'USER_NOT_FOUND'
          );
        }
        return isUser;
      } else if (userID) {
        const isUser = await prisma.user.findUnique({
          where: {
            id: userID,
          },
        });
        if (!isUser) {
          throw new AppError(
            'User Not Found',
            404,
            true,
            undefined,
            false,
            'USER_NOT_FOUND'
          );
        }

        return isUser;
      } else {
        throw new Error('Email or ID is required');
      }
    } catch (error) {
      return handleError(error, 'trying To Find user.');
    }
  }
  /**
   *
   *
   * Purpose: Async Find User Public Data in Database
   *
   * Context: Using user id we will find on the database user Public data. only public data without any secure information
   *  @param {string} [userID] : User ID for Finding the specific User
   *
   * Returns: <UserPublicData> Object if found in the Database.
   * @interface UserPublicData
   * - email: The user's email address.
   * - firstName: The user's first name.
   * - lastName: The user's last name, or null if not provided.
   *
   *
   */
  async findUserPublicDataInDatabase(userID: string): Promise<UserPublicData> {
    try {
      const isUser = await prisma.user.findUnique({
        where: {
          id: userID,
        },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      if (!isUser) {
        throw new AppError(
          'User Not Found',
          404,
          true,
          undefined,
          false,
          'USER_NOT_FOUND'
        );
      }
      return isUser;
    } catch (error) {
      return handleError(error, 'Finding User PUBLIC Data');
    }
  }
  /**
   *
   *
   * Purpose: Async Find User using Session ID in Database
   *
   * Context: Using Session id we will find User id in database
   *  @param {string} [sessionID] : Session ID for Finding the specific User
   *  @param {Redis} [redis] : Redis for Cache
   *
   * Returns: <Sessions> Object if found in the Database.
   *
   *
   */
  async findUserBySessionIdInDatabase(
    sessionID: string,
    redis: Redis | null
  ): Promise<Sessions> {
    try {
      const cashedSession = await redisService.get(sessionID, redis);
      if (cashedSession) {
        const sessionData: Sessions = JSON.parse(cashedSession);
        return sessionData;
      }
      const Session = await prisma.sessions.findUnique({
        where: {
          id: sessionID,
        },
      });
      if (!Session) {
        throw new AppError(
          'Session Not Found',
          404,
          true,
          undefined,
          false,
          'SESSION_NOT_FOUND'
        );
      }
      const stringSession = JSON.stringify(Session);
      await redisService.set(sessionID, stringSession, redis, 1800, 'session');

      return Session;
    } catch (error) {
      return handleError(error, 'Finding User By Session ID');
    }
  }
  /**
   *
   *
   * Purpose: Async find User OTP code
   *
   * Context: Using OTP user provide we check if OTP is valid and not Expired
   *
   * Returns: <Boolean> Object if found in the Database.
   *
   *
   */
  async retrieveOTPCode(
    userId: string,
    otp: string,
    redis: Redis | null
  ): Promise<boolean> {
    try {
      const otpCode = await redisService.get(otp, redis);
      if (otpCode && otpCode === userId) return true;
      const otpPrisma = await prisma.oTP.findUnique({
        where: {
          userId,
          otp,
        },
      });

      if (!otpPrisma) {
        throw new AppError(
          'Invalid Otp Code please Try again',
          400,
          true,
          undefined,
          false,
          'INVALID_OTP'
        );
      }
      const isExpired = isValidDate(otpPrisma.createdAt, 5);
      if (!isExpired) {
        throw new AppError(
          'Expired Otp Code please Try again',
          400,
          true,
          undefined,
          false,
          'EXPIRED_OTP'
        );
      }
      return true;
    } catch (error) {
      return handleError(error, 'Finding User By Session ID');
    }
  }
}

/**
 *
 *
 * Purpose : Instance of UserReadModel to handle user queries.
 *
 * Context : Use this instance to access methods for finding users in the database.
 *
 * Available Methods:
 * - `findUserInDatabase`: Find user by email or ID.
 * - `findUserPublicDataInDatabase`: Get public user data by user ID.
 * - `findUserBySessionIdInDatabase`: Find user session by session ID.
 *
 *
 */
const userReadModel = new UserReadModel();

export default userReadModel;
