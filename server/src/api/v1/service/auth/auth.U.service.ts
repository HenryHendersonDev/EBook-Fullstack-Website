import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import {
  findUserOnDBviaSessionID,
  findUserOnDBViaID,
  findUserOnDB,
} from '../../model/auth/auth.model';
import jwtService from '@/utils/auth/jwt';
import gen6DNumber from '@/utils/otpGen';
import template from '@/views/password-reset-email';
import sendEmail from '@/utils/email/sendEmail';
import { saveOTPonDB } from '../../model/auth/email.model';

// in This Function we will send the password Reset OTP to the User Email Address Using The Access Token Cookie
const userOTPreqViaToken = async (
  accessToken: string,
  redis: Redis | null
): Promise<boolean> => {
  try {
    const userSession = jwtService.verify(accessToken, false);
    if (!userSession) {
      throw new AppError(
        'Invalid Access Token',
        401,
        true,
        undefined,
        false,
        'UNAUTHORIZED_INVALID_TOKEN'
      );
    }
    const userID = await findUserOnDBviaSessionID(userSession.id, redis);
    if (!userID) {
      throw new AppError(
        'User Not Found',
        404,
        true,
        undefined,
        false,
        'USER_NOT_FOUND'
      );
    }
    const user = await findUserOnDBViaID(userID.userId);
    if (!user) {
      throw new AppError(
        'User Not Found',
        404,
        true,
        undefined,
        false,
        'USER_NOT_FOUND'
      );
    }
    const otp = gen6DNumber();
    const saveUser = await saveOTPonDB(user.id, otp, redis);
    if (!saveUser) return false;
    const emailSend = await sendEmail(
      user.email,
      'Password Reset Email Verification',
      template(otp)
    );
    if (!emailSend) {
      throw new AppError(
        'Something Went Wrong While Sending The Email',
        500,
        false,
        undefined,
        false,
        'SYSTEM_ERROR'
      );
    }
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Registering user',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

// in This Function we will send the password Reset OTP to the User Email Address Using The Email
const userOTPreqViaEmail = async (
  email: string,
  redis: Redis | null
): Promise<boolean> => {
  try {
    const DBuser = await findUserOnDB(email);
    if (!DBuser) {
      throw new AppError(
        'User Not Found',
        404,
        true,
        undefined,
        false,
        'USER_NOT_FOUND'
      );
    }
    const otp = gen6DNumber();
    const saveUser = await saveOTPonDB(DBuser.id, otp, redis);
    if (!saveUser) return false;
    const emailSend = await sendEmail(
      DBuser.email,
      'Password Reset Email Verification',
      template(otp)
    );
    if (!emailSend) {
      throw new AppError(
        'Something Went Wrong While Sending The Email',
        500,
        false,
        undefined,
        false,
        'SYSTEM_ERROR'
      );
    }
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Registering user',
        500,
        false,
        error,
        true,
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

export { userOTPreqViaToken, userOTPreqViaEmail };
