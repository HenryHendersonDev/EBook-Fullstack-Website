import { NextFunction, Request, Response } from 'express';
import { loginSchema } from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import userReadService from '../../service/auth/auth.R.service';

const loginUserAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = loginSchema.validate(req.body);
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
    const token = await userReadService.login(
      {
        email: req.body.email,
        password: req.body.password,
      },
      req.redis
    );
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
        message: 'User has been successfully Login.',
        code: 'SUCCESSFULLY_LOGIN',
      });
  } catch (error) {
    return next(error);
  }
};

// This Controller for Getting user Public Data
const getUserInfo = async (req: Request, res: Response, next: NextFunction) => {
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
    const userDATA = await userReadService.getPublicData(
      accessToken,
      req.redis
    );
    res.status(200).json({
      message: 'User has been successfully Get user Data.',
      code: 'SUCCESSFULLY_GET_USER_DATA',
      data: userDATA,
    });
  } catch (error) {
    return next(error);
  }
};

export { loginUserAccount, getUserInfo };
