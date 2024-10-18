import { NextFunction, Request, Response } from 'express';
import {
  loginSchema,
  loginSchemaEmailVerify,
  loginSchemaTotpVerify,
} from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import userReadService from '../../service/auth/auth.R.service';

const loginUserAccountTwoFactor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { method } = req.query;
    if (method !== 'email' && method !== 'totp') {
      throw new AppError(
        'Invalid Method',
        400,
        true,
        undefined,
        false,
        'INVALID_METHOD'
      );
    }
    if (method === 'email') {
      const { error } = loginSchemaEmailVerify.validate(req.body);
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
    }
    if (method === 'totp') {
      const { error } = loginSchemaTotpVerify.validate(req.body);
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
    }
    const key = method === 'email' ? req.body.otp : req.body.token;
    const response = await userReadService.loginTwoFactor(
      {
        email: req.body.email,
        password: req.body.password,
      },
      method as string,
      key,
      req.redis
    );

    res
      .cookie('accessToken', response, {
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
    if (typeof token !== 'string') {
      const methods = Object.fromEntries(
        Object.entries({
          email: token.email,
          totp: token.totp,
        }).filter(([_, value]) => value)
      );
      res.status(200).json({
        message: 'two factor auth required',
        code: 'NEED_TWO_FACTOR_AUTH',
        methods,
      });
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
        message: 'User has been successfully Login.',
        code: 'SUCCESSFULLY_LOGIN',
      });
  } catch (error) {
    return next(error);
  }
};

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

const validateAccountVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data, iv, tag } = req.query;
    if (!data || !iv || !tag) {
      throw new AppError(
        'Invalid Link',
        400,
        true,
        undefined,
        false,
        'INVALID_LINK'
      );
    }

    await userReadService.validateAccountVerification(
      data as string,
      iv as string,
      tag as string,
      req.redis
    );

    if (process.env['FRONTEND_URL']) {
      res.status(302).redirect(`${process.env['FRONTEND_URL']}?Verified=true`);
    } else {
      res.status(302).redirect('/?Verified=true');
    }
  } catch (error) {
    return next(error);
  }
};

export {
  loginUserAccount,
  getUserInfo,
  validateAccountVerification,
  loginUserAccountTwoFactor,
};
