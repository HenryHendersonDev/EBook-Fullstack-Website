import AppError from '@/models/AppErrorModel';
import jwtService from '@/utils/auth/jwt';
import handleError from '@/utils/errorHandle';
import Redis from 'ioredis';
import userDeleteModel from '../../model/auth/auth.D.model';
import userReadModel from '../../model/auth/auth.R.model';
interface IUserDeleteService {
  userLogOut(accessToken: string, redis: Redis | null): Promise<boolean>;
  userDelete(
    accessToken: string,
    otp: string,
    redis: Redis | null
  ): Promise<boolean>;
}

/**
 *
 * Purpose: User deleting Service
 *
 */

class UserDeleteService implements IUserDeleteService {
  /**
   *
   * Purpose: User Log Out
   *
   * Context: using Access Token that user have We Gonna Log out the User with removing session.
   *
   * Returns: Boolean. (mostly return true otherwise error trow)
   *
   */

  async userLogOut(accessToken: string, redis: Redis | null): Promise<boolean> {
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
      await userDeleteModel.deleteSessionData(userSession.id, redis);
      return true;
    } catch (error) {
      return handleError(error, 'Logging Out User');
    }
  }
  /**
   *
   * Purpose: Delete user account
   *
   * Context: using user AccessToken and Otp we gonna Delete the user account.
   *
   * Returns: Boolean. (mostly return true otherwise error trow)
   *
   */

  async userDelete(
    accessToken: string,
    otp: string,
    redis: Redis | null
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
      await userReadModel.retrieveOTPCode(userID.userId, otp, redis);
      await userDeleteModel.deleteUserAccount(userID.userId, redis);
      return true;
    } catch (error) {
      return handleError(error, 'Deleting User');
    }
  }
}

/**
 *
 * Purpose: Deleting user Service
 *
 */

const userDeleteService = new UserDeleteService();

export default userDeleteService;
