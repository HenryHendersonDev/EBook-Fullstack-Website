import handleError from '@/utils/errorHandle';
import Redis from 'ioredis';
import userReadModel from '../../model/auth/auth.R.model';
import passwordService from '@/utils/auth/bcrypt';
import AppError from '@/models/AppErrorModel';
import jwtService from '@/utils/auth/jwt';
import userVerifyLinkGenerate from '@/utils/auth/emailVerifyEncrypt';
import userUpdateModel from '../../model/auth/auth.U.model';

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
  validateAccountVerification(
    data: string,
    iv: string,
    tag: string,
    redis: Redis | null
  ): Promise<void>;
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
      return handleError(error, 'Getting user Public data');
    }
  }
  /**
   *
   * Purpose: Validate user account verification
   *
   * Context: using Url query we will check user verify true or false
   *
   * Returns: Void
   *
   */

  async validateAccountVerification(
    data: string,
    iv: string,
    tag: string,
    redis: Redis | null
  ): Promise<void> {
    try {
      const isValid = await userVerifyLinkGenerate.decryptUserEmailLink(
        data,
        iv,
        tag
      );
      if (!isValid) {
        throw new AppError(
          'Invalid Link',
          400,
          true,
          undefined,
          false,
          'INVALID_LINK'
        );
      }
      const divideString = (inputString) => {
        const parts = inputString.split('&');
        const email = parts[0].trim();
        const otp = parts[1].trim();
        return { email, otp };
      };
      const decodeData = divideString(isValid);
      const user = await userReadModel.findUserInDatabase({
        email: decodeData.email,
      });
      await userReadModel.retrieveOTPCode(user.id, decodeData.otp, redis);
      await userUpdateModel.makeUserVerified(user.id);
    } catch (error) {
      return handleError(error, 'verifying user');
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
