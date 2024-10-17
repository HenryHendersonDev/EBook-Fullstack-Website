import handleError from '@/utils/errorHandle';
import Redis from 'ioredis';
import userReadModel from '../../model/auth/auth.R.model';
import passwordService from '@/utils/auth/bcrypt';
import AppError from '@/models/AppErrorModel';
import jwtService from '@/utils/auth/jwt';

interface Login {
  email: string;
  password: string;
}
interface PublicData {
  email: string;
  firstName: string;
  lastName: string | null;
}
interface IUserReadService {
  login(user: Login, redis: Redis | null): Promise<string>;
  getPublicData(accessToken: string, redis: Redis | null): Promise<PublicData>;
}

/**
 *
 * Purpose: User Reading Service.
 *
 *
 */

class UserReadService implements IUserReadService {
  /**
   *
   * Purpose: Login User
   *
   * Context: Using User email and password we will Login User
   *
   * Returns: Access toke String
   *
   */

  async login(user: Login, redis: Redis | null): Promise<string> {
    try {
      const userDb = await userReadModel.findUserInDatabase({
        email: user.email,
      });
      const isValidPassword = await passwordService.verify(
        user.password,
        userDb.password
      );
      if (!isValidPassword) {
        throw new AppError(
          'Invalid Password',
          400,
          true,
          undefined,
          false,
          'INVALID_PASSWORD'
        );
      }
      const accessToken = await jwtService.sign(userDb.id, redis);
      return accessToken;
    } catch (error) {
      return handleError(error, 'Login user');
    }
  }
  /**
   *
   * Purpose: get User public Data
   *
   * Context: Using access token Get User publicly available Information from database
   *
   * Returns: <PublicData> object
   *
   */

  async getPublicData(
    accessToken: string,
    redis: Redis | null
  ): Promise<PublicData> {
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
      const PublicData = await userReadModel.findUserPublicDataInDatabase(
        userID.userId
      );
      return PublicData;
    } catch (error) {
      return handleError(error, 'Getting user Pulic data');
    }
  }
}

/**
 *
 * Purpose: User Reading Service.
 *
 */

const userReadService = new UserReadService();

export default userReadService;
