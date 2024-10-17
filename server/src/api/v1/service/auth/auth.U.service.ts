import AppError from '@/models/AppErrorModel';
import jwtService from '@/utils/auth/jwt';
import handleError from '@/utils/errorHandle';
import Redis from 'ioredis';
import userReadModel from '../../model/auth/auth.R.model';
import userUpdateModel from '../../model/auth/auth.U.model';

interface IUserUpdateService {
  resetPasswordByToken(
    accessToken: string,
    otp: string,
    newPassword: string,
    redis: Redis | null
  ): Promise<string>;

  resetPasswordByEmail(
    email: string,
    otp: string,
    newPassword: string,
    redis: Redis | null
  ): Promise<string>;

  updateUserNames(
    accessToken: string,
    redis: Redis | null,
    firstName?: string,
    lastName?: string
  ): Promise<boolean>;
}

/**
 *
 * Purpose: Update User Service.
 *
 */

class UserUpdateService implements IUserUpdateService {
  /**
   *
   * Purpose: Resetting Password using Token
   *
   * Context: Reset the password using the access token provided
   *
   * Returns: new Access token <string>
   *
   */

  async resetPasswordByToken(
    accessToken: string,
    otp: string,
    newPassword: string,
    redis: Redis | null
  ): Promise<string> {
    try {
      const userSession = jwtService.verify(accessToken, false);
      if (!userSession) {
        throw new AppError(
          'User Not Found',
          401,
          true,
          undefined,
          false,
          'UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN'
        );
      }
      const userID = await userReadModel.findUserBySessionIdInDatabase(
        userSession.id,
        redis
      );
      const user = await userReadModel.findUserInDatabase({
        userID: userID.userId,
      });
      await userReadModel.retrieveOTPCode(user.id, otp, redis);
      const passwordSet = await userUpdateModel.setNewPassword(
        user.id,
        newPassword,
        redis
      );
      const newAccessToken = await jwtService.sign(passwordSet.id, redis);
      return newAccessToken;
    } catch (error) {
      return handleError(error, 'Resetting password using Access token');
    }
  }

  /**
   *
   * Purpose: Resetting Password using Email
   *
   * Context: Reset the password using the access Email provided
   *
   * Returns: new Access token <string>
   *
   */

  async resetPasswordByEmail(
    email: string,
    otp: string,
    newPassword: string,
    redis: Redis | null
  ): Promise<string> {
    try {
      const user = await userReadModel.findUserInDatabase({
        email,
      });
      await userReadModel.retrieveOTPCode(user.id, otp, redis);
      const passwordSet = await userUpdateModel.setNewPassword(
        user.id,
        newPassword,
        redis
      );
      const newAccessToken = await jwtService.sign(passwordSet.id, redis);
      return newAccessToken;
    } catch (error) {
      return handleError(error, 'Resetting password using Email Address');
    }
  }

  /**
   *
   * Purpose: Update user name
   *
   * Context: update user first or last or both first and last names.
   *
   * Returns: boolean most of the time true otherwise it throw error
   *
   */

  async updateUserNames(
    accessToken: string,
    redis: Redis | null,
    firstName?: string,
    lastName?: string
  ): Promise<boolean> {
    try {
      const userSession = jwtService.verify(accessToken, false);
      if (!userSession) {
        throw new AppError(
          'User Not Found',
          401,
          true,
          undefined,
          false,
          'UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN'
        );
      }
      const userID = await userReadModel.findUserBySessionIdInDatabase(
        userSession.id,
        redis
      );

      if (firstName && !lastName) {
        await userUpdateModel.updateFirstName(userID.userId, firstName);
        return true;
      } else if (lastName && !firstName) {
        await userUpdateModel.updateLastName(userID.userId, lastName);
        return true;
      } else if (firstName && lastName) {
        await userUpdateModel.updateFullName(
          userID.userId,
          firstName,
          lastName
        );
        return true;
      }
      return false;
    } catch (error) {
      return handleError(error, 'updating user first or last or both name');
    }
  }
}

/**
 *
 * Purpose: Update User Service.
 *
 */

const userUpdateService = new UserUpdateService();

export default userUpdateService;
