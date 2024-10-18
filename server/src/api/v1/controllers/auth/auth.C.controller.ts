import { NextFunction, Request, Response } from 'express';
import {
  emailVerifySchema,
  registerSchema,
} from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import userCreateService from '../../service/auth/auth.C.service';

const createUserAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = registerSchema.validate(req.body);
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

    const token = await userCreateService.userRegisterService(
      {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,

        filePath: req.file ? req.file.path : null,
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
      .status(201)
      .json({
        message: 'User has been successfully created.',
        code: 'SUCCESSFULLY_CREATED',
      });
  } catch (error) {
    return next(error);
  }
};

const sendVerificationEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.signedCookies;
    const { error } = emailVerifySchema.validate(req.body);
    if (error && !accessToken) {
      throw new AppError(
        error.details[0].message,
        400,
        true,
        undefined,
        false,
        'SCHEMA_VALIDATE_ERROR'
      );
    }

    await userCreateService.sendVerificationEmail(
      {
        accessToken,
        email: req.body.email,
      },
      req.redis
    );

    res.status(200).json({
      message: 'successfully sent user account verification Email',
      code: 'SUCCESSFULLY_SEND_VERIFICATION_EMAIL',
    });
  } catch (error) {
    return next(error);
  }
};

export { createUserAccount, sendVerificationEmailController };
