import { NextFunction, Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchemaToken,
  passwordResetSchema,
  NameChange,
  delUserSchema,
} from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import userRegisterService from '../service/auth/auth.C.service';
import {
  getUserDataService,
  userLoginService,
} from '../service/auth/auth.R.service';
import {
  userDeleteService,
  userLogoutService,
} from '../service/auth/auth.D.service';
import {
  PasswordResetEmail,
  PasswordResetToken,
  updateName,
  userOTPreqViaEmail,
  userOTPreqViaToken,
} from '../service/auth/auth.U.service';

// This controller for Creating New user and Returning The access token as Cookie and Status Code 201
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
      .status(201)
      .json({
        message: 'User has been successfully created.',
        code: 'SUCCESSFULLY_CREATED',
      });
  } catch (error) {
    return next(error);
  }
};

// This controller for Logging In the user and return access token as cookie with status Code 200
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
    const token = await userLoginService(
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

// This controller for Logging In the user and return access token as cookie with status Code 200
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

    await userLogoutService(accessToken, req.redis);
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

// This controller For Sending  OTP code to user email Address.
const reqOtoCODE = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.signedCookies;
    if (accessToken) {
      const isSend = await userOTPreqViaToken(accessToken, req.redis);
      if (!isSend) {
        throw new AppError(
          'Something Went Wrong While Sending The Email',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      res.status(200).json({
        message: 'The OTP code successfully Sent To User Email Address',
        code: 'SUCCESSFULLY_SENT_OTP',
      });
    } else {
      const { error } = passwordResetRequestSchema.validate(req.body);
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
      const isSend = await userOTPreqViaEmail(req.body.email, req.redis);

      if (!isSend) {
        throw new AppError(
          'Something Went Wrong While Sending The Email',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      res.status(200).json({
        message: 'The OTP code successfully Sent To User Email Address',
        code: 'SUCCESSFULLY_SENT_OTP',
      });
    }
  } catch (error) {
    return next(error);
  }
};

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
    const userDATA = await getUserDataService(accessToken, req.redis);
    res.status(200).json({
      message: 'User has been successfully Get user Data.',
      code: 'SUCCESSFULLY_GET_USER_DATA',
      data: userDATA,
    });
  } catch (error) {
    return next(error);
  }
};

// This Controller for Getting user Public Data
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
    await userDeleteService(accessToken, req.body.otp, req.redis);
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

export {
  createUserAccount,
  loginUserAccount,
  logoutUserAccount,
  reqOtoCODE,
  passwordReset,
  changeUser_Names,
  getUserInfo,
  deleteUser,
};
