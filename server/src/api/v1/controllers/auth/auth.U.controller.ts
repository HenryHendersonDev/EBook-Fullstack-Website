import { NextFunction, Request, Response } from 'express';
import {
  passwordResetSchemaToken,
  passwordResetSchema,
  NameChange,
} from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import {
  PasswordResetEmail,
  PasswordResetToken,
  updateName,
} from '../../service/auth/auth.U.service';

// This controller For Resetting The Password using Token or Email and new Password
const passwordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.signedCookies;
    if (accessToken) {
      const { error } = passwordResetSchemaToken.validate(req.body);
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
      const token = await PasswordResetToken(
        accessToken,
        req.body.otp,
        req.body.newPassword,
        req.redis
      );
      if (!token) {
        throw new AppError(
          'Something Went Wrong While Sending The Email',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      res
        .cookie('accessToken', token, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'strict',
          signed: true,
          expires: new Date(Date.now() + 1000 * 60 * 15),
          path: '/',
        })
        .status(200)
        .json({
          message: 'User has been successfully Reset the password.',
          code: 'SUCCESSFULLY_RESET_PASSWORD',
        });
    } else {
      const { error } = passwordResetSchema.validate(req.body);
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
      const token = await PasswordResetEmail(
        req.body.email,
        req.body.otp,
        req.body.newPassword,
        req.redis
      );
      if (!token) {
        throw new AppError(
          'Something Went Wrong While Sending The Email',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      res
        .cookie('accessToken', token, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'strict',
          signed: true,
          expires: new Date(Date.now() + 1000 * 60 * 15),
          path: '/',
        })
        .status(200)
        .json({
          message: 'User has been successfully Reset the password.',
          code: 'SUCCESSFULLY_RESET_PASSWORD',
        });
    }
  } catch (error) {
    return next(error);
  }
};

// This controller For Resetting The Password using Token or Email and new Password
const changeUser_Names = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.signedCookies;
    const { error } = NameChange.validate(req.body);
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
    const update = await updateName(
      accessToken,
      req.redis,
      req.body.firstName,
      req.body.lastName
    );
    if (!update) {
      throw new AppError(
        'Something Went Wrong Updating user Names',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }
    res.status(200).json({
      message: 'User has been successfully Updated The names.',
      code: 'SUCCESSFULLY_RESET_UPDATED_NAMES',
    });
  } catch (error) {
    return next(error);
  }
};

export { passwordReset, changeUser_Names };
