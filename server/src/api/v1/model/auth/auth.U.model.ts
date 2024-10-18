import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import redisService from '@/utils/cache/redisCache';
import handleError from '@/utils/errorHandle';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import Redis from 'ioredis';
interface IUserUpdateModel {
  setNewPassword(
    userId: string,
    password: string,
    redis: Redis | null
  ): Promise<User>;

  updateFirstName(userId: string, firstName: string): Promise<User>;

  updateLastName(userId: string, lastName: string): Promise<User>;

  updateFullName(
    userId: string,
    firstName: string,
    lastName: string
  ): Promise<User>;

  updateTotpSecret(userId: string, totpSecret: string): Promise<User>;

  makeUserVerified(userId: string): Promise<void>;

  makeUserEmailVerify(userId: string): Promise<void>;

  removeUserEmailVerify(userId: string): Promise<void>;
}

/**
 *
 * Purpose: Used for updating User Information on Database
 *
 */

class UserUpdateModel implements IUserUpdateModel {
  /**
   *
   * Purpose: Update User password
   *
   * Context: Using User id and new password we will change User new password and remove all sessions.
   *
   * Returns: User Object
   *
   */

  async setNewPassword(
    userId: string,
    password: string,
    redis: Redis | null
  ): Promise<User> {
    try {
      const prismaTransAction = await prisma.$transaction(
        async (prisma): Promise<User> => {
          const user: User = await prisma.user.update({
            where: { id: userId },
            data: {
              password,
            },
          });
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
          return user;
        }
      );
      return prismaTransAction;
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
      return handleError(error, ' setting User new Password');
    }
  }
  /**
   *
   * Purpose: update User first name
   *
   * Context: using user id an new first name we will change user current first name to new first name.
   *
   * Returns: User object
   *
   */

  async updateFirstName(userId: string, firstName: string): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
        },
      });
      return updatedUser;
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
      return handleError(error, ' Changing user first name');
    }
  }
  /**
   *
   * Purpose: update User Last name
   *
   * Context: using user id an new Last name we will change user current Last name to new Last name.
   *
   * Returns: User object
   *
   */

  async updateLastName(userId: string, lastName: string): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          lastName,
        },
      });
      return updatedUser;
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
      return handleError(error, ' Changing user last name');
    }
  }
  /**
   *
   * Purpose: update User Full name
   *
   * Context: using user id an new Full name we will change user current Full name to new Full name.
   *
   * Returns: User object
   *
   */

  async updateFullName(
    userId: string,
    firstName: string,
    lastName: string
  ): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          firstName,
          lastName,
        },
      });
      return updatedUser;
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
      return handleError(error, 'Updating First and last Name');
    }
  }

  /**
   *
   * Purpose: Adding or update TOTP Secret
   *
   * Context: Updating or adding TOTP Secret to User table.
   *
   * Returns: User object
   *
   */

  async updateTotpSecret(userId: string, totpSecret: string): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          totpSecret,
          isTotpEnabled: true,
        },
      });
      return updatedUser;
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
      return handleError(error, 'Adding Or Updating TOTP secret.');
    }
  }
  /**
   *
   * Purpose: make user Verified
   *
   * Context: Using user id make user verified
   *
   * Returns: Void
   *
   */

  async makeUserVerified(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          verified: true,
        },
      });
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
      return handleError(error, ' setting User new Password');
    }
  }
  /**
   *
   * Purpose: make user Email verification
   *
   * Context: using user id enable user required email verification for two factor
   *
   * Returns: Void
   *
   */

  async makeUserEmailVerify(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isEmailVerificationEnabled: true,
        },
      });
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
      return handleError(error, ' setting User new Password');
    }
  }
  /**
   *
   * Purpose: Remove user Email verification
   *
   * Context: using user id enable user remove email verification for two factor
   *
   * Returns: Void
   *
   */

  async removeUserEmailVerify(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isEmailVerificationEnabled: false,
        },
      });
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
      return handleError(error, ' setting User new Password');
    }
  }
}

/**
 *
Purpose: Used for updating User Information on Database
 *
 */

const userUpdateModel = new UserUpdateModel();

export default userUpdateModel;
