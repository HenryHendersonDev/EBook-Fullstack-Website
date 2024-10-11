import { NextFunction, Request, Response } from 'express';
import { registerSchema } from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import userRegisterService from '../service/auth/auth.C.service';
import handleUpload from '@/config/cloudinaryConfig';

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
    const token = await userRegisterService(
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
      .json({
        message: 'User has been successfully created.',
        code: 'SUCCESSFULLY_CREATED',
      });
  } catch (error) {
    return next(error);
  }
};

export { createUserAccount };
