import passwordService from '@/utils/auth/bcrypt';
import storageUtils from '@/utils/cloudinaryUtils';
import handleError from '@/utils/errorHandle';
import Redis from 'ioredis';
import userCreateModel from '../../model/auth/auth.C.model';
import jwtService from '@/utils/auth/jwt';
import AppError from '@/models/AppErrorModel';
import userReadModel from '../../model/auth/auth.R.model';
import userVerifyLinkGenerate from '@/utils/auth/emailVerifyEncrypt';
import sendEmail from '@/utils/email/sendEmail';
import emailVerificationAccount from '@/views/emailVerification';
import gen6DNumber from '@/utils/otpGen';

interface Register {
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
  filePath: string | null;
}
interface IUserCreateService {
  userRegisterService(user: Register, redis: Redis | null): Promise<string>;
  sendVerificationEmail(
    params: { email?: string; accessToken?: string },
    redis: Redis | null
  ): Promise<void>;
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
  /**
   *
   * Purpose: send Email
   *
   * Context: Given user email or access token we will send Verification email to user email address
   *
   * Returns: Void
   *
   */

  async sendVerificationEmail(
    params: { email?: string; accessToken?: string },
    redis: Redis | null
  ): Promise<void> {
    try {
      let userEmail = params.email!;
      if (!params.email && params.accessToken) {
        const userSession = jwtService.verify(params.accessToken, false);
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
        const { email } = await userReadModel.findUserInDatabase({
          userID: userID.userId,
        });
        userEmail = email;
      }
      const user = await userReadModel.findUserInDatabase({
        email: userEmail,
      });

      const otp = gen6DNumber();
      await userCreateModel.createNewOtpCode(user.id, otp, redis);

      const link = await userVerifyLinkGenerate.encryptUserEmailLink(
        `${user.email}&${otp}`
      );
      await sendEmail(
        user.email,
        'Verify Your Email Address',
        emailVerificationAccount(link, user.firstName)
      );
    } catch (error) {
      return handleError(error, 'sending user Email');
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
