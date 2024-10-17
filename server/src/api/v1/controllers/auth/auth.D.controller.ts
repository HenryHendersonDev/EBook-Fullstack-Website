import { NextFunction, Request, Response } from 'express';
import { delUserSchema } from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import userDeleteService from '../../service/auth/auth.D.service';

const logoutUserAccount = async (
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

    await userDeleteService.userLogOut(accessToken, req.redis);
    res
      .cookie('accessToken', '', {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        signed: true,
        expires: new Date(0),
        path: '/',
      })
      .status(200)
      .json({
        message: 'User has been successfully logout.',
        code: 'SUCCESSFULLY_LOGOUT',
      });
  } catch (error) {
    return next(error);
  }
};

// This Controller for Deleting User
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.signedCookies;
    const { error } = delUserSchema.validate(req.body);
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
    await userDeleteService.userDelete(accessToken, req.body.otp, req.redis);
    res
      .cookie('accessToken', '', {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        signed: true,
        expires: new Date(0),
        path: '/',
      })
      .status(200)
      .json({
        message: 'User has been successfully Deleted.',
        code: 'SUCCESSFULLY_DELETED_USER',
      });
  } catch (error) {
    return next(error);
  }
};

export { logoutUserAccount, deleteUser };
