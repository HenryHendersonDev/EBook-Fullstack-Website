import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';
import redisService from '@/utils/cache/redisCache';
import handleError from '@/utils/errorHandle';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import Redis from 'ioredis';

interface IUserDeleteModel {
  deleteUserAccount(userId: string, redis: Redis | null): Promise<boolean>;
  deleteSessionData(sessionId: string, redis: Redis | null): Promise<boolean>;
  deleteTotpKeys(userId: string): Promise<boolean>;
}

/**
 *
 * Purpose: Deleting Task Handle User Model
 *
 * Context: handle user deletions such as account, TOTP, Sessions.
 *
 */

class UserDeleteModel implements IUserDeleteModel {
  /**
   *
   * Purpose: take user ID and Delete User Sessions.
   *
   * Context: take user id and redis then delete user sessions along with cashed data and after user account
   *
   * Returns: boolean saying true
   *
   */

  async deleteUserAccount(
    userId: string,
    redis: Redis | null
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (prisma) => {
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
      });
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
      return handleError(error, 'Deleting User');
    }
  }
  /**
   *
   * Purpose: Delete session Data
   *
   * Context: Delete user Specific Session
   *
   * Returns: Boolean saying true
   *
   */

  async deleteSessionData(
    sessionId: string,
    redis: Redis | null
  ): Promise<boolean> {
    try {
      if (redis) {
        await redisService.delete(sessionId, redis);
      }
      await prisma.sessions.delete({
        where: {
          id: sessionId,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError(
            'session Not Found',
            404,
            true,
            undefined,
            false,
            'SESSION_NOT_FOUND'
          );
        }
      }
      return handleError(error, 'Deleting Session');
    }
  }
  /**
   *
   * Purpose: Remove totp key
   *
   * Context: Remove TOTP key and setting totp not enable after removing the key
   *
   * Returns: Boolean saying true
   *
   */

  async deleteTotpKeys(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: null,
          isTotpEnabled: false,
        },
      });

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
      return handleError(error, 'Deleting TOTP');
    }
  }
}

/**
 *
 * Purpose: User Deletion Model.
 *
 * Context: this class will do some user model delete Tasks
 *
 */

const userDeleteModel = new UserDeleteModel();

export default userDeleteModel;
