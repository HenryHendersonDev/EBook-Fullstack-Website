import AppError from '@/models/AppErrorModel';
import { NextFunction, Request, Response } from 'express';
import {
  removeTotpUsingTotpSchema,
  removeTotpUsingEmailSchema,
  twoFaVerifySchema,
} from '../../validators/index.Validation';
import userTwoFactorAuthService from '../../service/auth/auth.2fa.service';
import userReadModel from '../../model/auth/auth.R.model';
import jwtService from '@/utils/auth/jwt';

const createTotp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.signedCookies;
    if (!accessToken) {
      throw new AppError(
        'You are not logged in',
        401,
        true,
        undefined,
        false,
        'NOT_LOGGED_IN'
      );
    }

    const token = await userTwoFactorAuthService.generateTotp(
      accessToken,
      req.redis
    );
    res.status(200).json({
      message: 'Successfully Created totp Key',
      code: 'SUCCESSFULLY_CREATED_TOTP',
      data: token,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyTotp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = twoFaVerifySchema.validate(req.body);
    if (!req.body.email) {
      const { accessToken } = req.signedCookies;
      if (!accessToken) {
        throw new AppError(
          'You are not providing an email or you are not logged in.',
          400,
          true,
          undefined,
          false,
          'SCHEMA_VALIDATE_ERROR'
        );
      }
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
        req.redis
      );
      const { email } = await userReadModel.findUserInDatabase({
        userID: userID.userId,
      });
      req.body.email = email;
    }
    if (error) {
      throw new AppError(
        error.details[0].message,
        400,
        true,
        undefined,
        false,
        'SCHEMA_VALIDATE_ERROR'
      );
    }
    const token = await userTwoFactorAuthService.verifyTotp(
      req.body.email,
      req.body.token
    );
    if (!token) {
      throw new AppError(
        'Invalid totp Token',
        400,
        true,
        undefined,
        false,
        'INVALID_TOTP_TOKEN'
      );
    }
    res.status(200).json({
      message: 'Successfully Verified totp',
      code: 'SUCCESSFULLY_VERIFIED_TOTP',
    });
  } catch (error) {
    return next(error);
  }
};

const removeTotpUsingEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = removeTotpUsingEmailSchema.validate(req.body);

    if (error) {
      throw new AppError(
        error.details[0].message,
        400,
        true,
        undefined,
        false,
        'SCHEMA_VALIDATE_ERROR'
      );
    }

    await userTwoFactorAuthService.removeTotpByEmail(
      req.body.otp,
      req.body.email,
      req.body.password,
      req.redis
    );
    res.status(200).json({
      message: 'Successfully Removed totp',
      code: 'SUCCESSFULLY_REMOVED_TOTP',
    });
  } catch (error) {
    return next(error);
  }
};

const removeTotpUsingTotp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.signedCookies;
    if (!accessToken) {
      throw new AppError(
        'You are not logged in',
        401,
        true,
        undefined,
        false,
        'NOT_LOGGED_IN'
      );
    }
    const { error } = removeTotpUsingTotpSchema.validate(req.body);
    if (error) {
      throw new AppError(
        error.details[0].message,
        400,
        true,
        undefined,
        false,
        'SCHEMA_VALIDATE_ERROR'
      );
    }

    const remove = await userTwoFactorAuthService.removeTotpBytotp(
      accessToken,
      req.body.token,
      req.redis
    );
    res.status(200).json({
      message: 'Successfully Removed Totp',
      code: 'SUCCESSFULLY_REMOVED_TOTP',
    });
  } catch (error) {
    return next(error);
  }
};

export { createTotp, verifyTotp, removeTotpUsingEmail, removeTotpUsingTotp };
