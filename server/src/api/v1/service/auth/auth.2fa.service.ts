import jwtService from '@/utils/auth/jwt';
import handleError from '@/utils/errorHandle';
import Redis from 'ioredis';
import userReadModel from '../../model/auth/auth.R.model';
import totpUtils from '@/utils/auth/totp';
import userUpdateModel from '../../model/auth/auth.U.model';
import sendEmail from '@/utils/email/sendEmail';
import emailVerification from '@/views/2fa-enable';
import AppError from '@/models/AppErrorModel';
import passwordService from '@/utils/auth/bcrypt';
import userDeleteModel from '../../model/auth/auth.D.model';
import gen6DNumber from '@/utils/otpGen';
import userCreateModel from '../../model/auth/auth.C.model';
import template from '@/views/password-reset-email';

interface CreateTotp {
  secret: string;
  base64: string;
}

interface IUserTwoFactorAuthService {
  generateTotp(
    accessToken: string,
    otp: string,
    redis: Redis | null
  ): Promise<CreateTotp>;

  verifyTotp(totp: string, email: string): Promise<boolean>;

  removeTotpByEmail(
    otp: string,
    email: string,
    password: string,
    redis: Redis | null
  ): Promise<boolean>;

  removeTotpBytotp(
    accessToken: string,
    token: string,
    redis: Redis | null
  ): Promise<boolean>;

  otpRequestByAccessToken(
    accessToken: string,
    redis: Redis | null
  ): Promise<boolean>;

  otpRequestByEmail(email: string, redis: Redis | null): Promise<boolean>;
}

/**
 *
 * Purpose: Handle two Factor Auth
 *
 */

class UserTwoFactorAuthService implements IUserTwoFactorAuthService {
  /**
   *
   * Purpose: Generate totp Secret
   *
   * Context: using access toke we will find user and generate totp secret.
   *
   * Returns: <CreateTotp> object.
   *
   */

  async generateTotp(
    accessToken: string,
    otp: string,
    redis: Redis | null
  ): Promise<CreateTotp> {
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
      const { secret, otpauth_url } = totpUtils.generateSecretKey();
      const base64Image = await totpUtils.generateQRCode(otpauth_url);

      const updateUser = await userUpdateModel.updateTotpSecret(
        userID.userId,
        secret
      );
      await sendEmail(
        updateUser.email,
        '🎉 Two-Factor Authentication Enabled Successfully!',
        emailVerification(updateUser.firstName)
      );
      return {
        secret: secret,
        base64: base64Image,
      };
    } catch (error) {
      return handleError(error, 'Generating TOTP secret Service');
    }
  }
  /**
   *
   * Purpose: verifiy totp code
   *
   * Context: using user given
   *
   * Returns: boolean saying that user secret true or false.
   *
   */

  async verifyTotp(email: string, totp: string): Promise<boolean> {
    try {
      const user = await userReadModel.findUserInDatabase({
        email,
      });
      if (!user.totpSecret) {
        throw new AppError(
          '2FA not enabled for this user',
          400,
          true,
          undefined,
          false,
          'TOTP_NOT_ENABLED'
        );
      }
      const isValid = totpUtils.verifyToken(user.totpSecret, totp);
      if (!isValid) {
        throw new AppError(
          'Invalid Totp Token',
          400,
          true,
          undefined,
          false,
          'INVALID_TOTP_TOKEN'
        );
      }
      return true;
    } catch (error) {
      return handleError(error, 'Verifying Totp on Service');
    }
  }
  /**
   *
   * Purpose:  remove totp by email
   *
   * Context:  using user given email and password we will find user and remove totp secret. if only true info
   *
   * Returns: Boolean most of the time true otherwise it throw error automatically.
   *
   */

  async removeTotpByEmail(
    otp: string,
    email: string,
    password: string,
    redis: Redis | null
  ): Promise<boolean> {
    try {
      const user = await userReadModel.findUserInDatabase({
        email,
      });
      if (!user.totpSecret) {
        throw new AppError(
          '2FA not enabled for this user',
          400,
          true,
          undefined,
          false,
          'TOTP_NOT_ENABLED'
        );
      }
      const isValidPassword = await passwordService.verify(
        password,
        user.password
      );
      if (!isValidPassword) {
        throw new AppError(
          'user Provided password is Incorrect.',
          401,
          true,
          undefined,
          false,
          'INCORRECT_PASSWORD'
        );
      }
      await userReadModel.retrieveOTPCode(user.id, otp, redis);
      await userDeleteModel.deleteTotpKeys(user.id);
      return true;
    } catch (error) {
      return handleError(error, 'Removing User totp by email');
    }
  }
  /**
   *
   * Purpose:  remove totp by token
   *
   * Context:  using user given token we will find user and remove totp secret. if only true info
   *
   * Returns: Boolean most of the time true otherwise it throw error automatically.
   *
   */

  async removeTotpBytotp(
    accessToken: string,
    totp: string,
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
      const user = await userReadModel.findUserInDatabase({
        userID: userID.userId,
      });

      if (!user.totpSecret) {
        throw new AppError(
          '2FA not enabled for this user',
          400,
          true,
          undefined,
          false,
          'TOTP_NOT_ENABLED'
        );
      }
      const isValid = totpUtils.verifyToken(user.totpSecret, totp);

      if (!isValid) {
        throw new AppError(
          'Invalid Totp Token',
          400,
          true,
          undefined,
          false,
          'INVALID_TOTP_TOKEN'
        );
      }
      await userDeleteModel.deleteTotpKeys(user.id);
      return true;
    } catch (error) {
      return handleError(error, 'Removing user Totp By Totp');
    }
  }

  /**
   *
   * Purpose: Send otp Code.
   *
   * Context: Send otp code to user email using access token
   *
   * Returns: Boolean: most of the time it send true
   *
   */

  async otpRequestByAccessToken(
    accessToken: string,
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
      const user = await userReadModel.findUserInDatabase({
        userID: userID.userId,
      });

      const otp = gen6DNumber();
      await userCreateModel.createNewOtpCode(user.id, otp, redis);
      const emailSend = await sendEmail(
        user.email,
        'Your Verification Code is Here!',
        template(otp)
      );
      if (!emailSend) {
        throw new AppError(
          'Something Went Wrong While Sending The Email',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      return true;
    } catch (error) {
      return handleError(error, '');
    }
  }

  /**
   *
   * Purpose: Send otp Code.
   *
   * Context: using email we will send email to user.
   *
   * Returns: Boolean: most of the time it send true
   *
   */

  async otpRequestByEmail(
    email: string,
    redis: Redis | null
  ): Promise<boolean> {
    try {
      const user = await userReadModel.findUserInDatabase({
        email,
      });
      const otp = gen6DNumber();
      await userCreateModel.createNewOtpCode(user.id, otp, redis);
      const emailSend = await sendEmail(
        user.email,
        'Your Verification Code is Here!',
        template(otp)
      );
      if (!emailSend) {
        throw new AppError(
          'Something Went Wrong While Sending The Email',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      return true;
    } catch (error) {
      return handleError(error, 'Sending email by email on service');
    }
  }
}

/**
 *
 * Purpose: Handle two Factor Auth
 *
 */

const userTwoFactorAuthService = new UserTwoFactorAuthService();

export default userTwoFactorAuthService;
