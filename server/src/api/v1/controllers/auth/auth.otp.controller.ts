import { NextFunction, Request, Response } from 'express';
import { passwordResetRequestSchema } from '@/api/v1/validators/index.Validation';
import AppError from '@/models/AppErrorModel';
import {
  userOTPreqViaEmail,
  userOTPreqViaToken,
} from '../../service/auth/auth.otp.service';

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

export { reqOtoCODE };
