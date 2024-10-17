import passwordService from '@/utils/auth/bcrypt';
import storageUtils from '@/utils/cloudinaryUtils';
import handleError from '@/utils/errorHandle';
import Redis from 'ioredis';
import userCreateModel from '../../model/auth/auth.C.model';
import jwtService from '@/utils/auth/jwt';

interface Register {
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
  filePath: string | null;
}
interface IUserCreateService {
  userRegisterService(user: Register, redis: Redis | null): Promise<string>;
}

/**
 *
 * Purpose: User Service for Creating
 *
 */

class UserCreateService implements IUserCreateService {
  /**
   *
   * Purpose: Create Model
   *
   * Context: Using Given User Information creating new User with Hashing Password
   *
   * Returns: Json Web Token Access Token
   *
   */

  async userRegisterService(
    user: Register,
    redis: Redis | null
  ): Promise<string> {
    try {
      const hashPassword = await passwordService.generate(user.password);
      user.password = hashPassword;

      if (user.filePath) {
        const { url, public_id } = await storageUtils.upload(user.filePath);
        const data = {
          email: user.email,
          password: hashPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          filePath: url ? url : null,
          imagePublicID: public_id ? public_id : null,
        };
        try {
          const userID = await userCreateModel.createNewUserInDatabase(data);
          const accessToken = await jwtService.sign(userID, redis);
          return accessToken;
        } catch (error) {
          return handleError(error, 'creating user');
        }
      }
      const userID = await userCreateModel.createNewUserInDatabase(user);
      const accessToken = await jwtService.sign(userID, redis);
      return accessToken;
    } catch (error) {
      return handleError(error, 'creating user');
    }
  }
}

/**
 *
 * Purpose: Creating User Service.
 *
 */

const userCreateService = new UserCreateService();

export default userCreateService;
