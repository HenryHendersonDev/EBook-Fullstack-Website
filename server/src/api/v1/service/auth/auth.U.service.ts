import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import {
  findUserOnDBviaSessionID,
  findUserOnDBViaID,
  findUserOnDB,
  findOTPCode,
  setNewPassword,
  UpdateUserFullName,
  UpdateUserLastName,
  UpdateUserFirstName,
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
      'Your Verification Code is Here!',
      template(otp)
    );
    if (!emailSend) {
      throw new AppError(
        'Something Went Wrong While Sending The Email',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Requesting user OTP Code Using the Access Token',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
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
      'Your Verification Code is Here!',
      template(otp)
    );
    if (!emailSend) {
      throw new AppError(
        'Something Went Wrong While Sending The Email',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Requesting user OTP Code Using the Email',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

// in This Function we will Get the OTP code and Token Then Reset The password
const PasswordResetToken = async (
  accessToken: string,
  otp: string,
  newPassword: string,
  redis: Redis | null
): Promise<string> => {
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

    const isTrueOTP = await findOTPCode(user.id, otp, redis);
    if (!isTrueOTP) {
      throw new AppError(
        'Invalid Otp Code please Try again',
        400,
        true,
        undefined,
        false,
        'INVALID_OTP'
      );
    }
    const passwordSet = await setNewPassword(user.id, newPassword, redis);
    if (!passwordSet) {
      throw new AppError(
        'Something Went Wrong Updating user password',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }
    const newToken = await jwtService.sign(user.id, redis);
    return newToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Resetting User password Using Token',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

// in This Function we will Get the OTP code and Email Then Reset The password
const PasswordResetEmail = async (
  email: string,
  otp: string,
  newPassword: string,
  redis: Redis | null
): Promise<string> => {
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
    const isTrueOTP = await findOTPCode(DBuser.id, otp, redis);
    if (!isTrueOTP) {
      throw new AppError(
        'Invalid Otp Code please Try again',
        400,
        true,
        undefined,
        false,
        'INVALID_OTP'
      );
    }
    const passwordSet = await setNewPassword(DBuser.id, newPassword, redis);
    if (!passwordSet) {
      throw new AppError(
        'Something Went Wrong Updating user password',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
    }
    const newToken = await jwtService.sign(DBuser.id, redis);
    return newToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Resetting User password Using Email',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

// in This Function we will Update user First and Last names
const updateName = async (
  accessToken: string,
  redis: Redis | null,
  firstName?: string,
  lastName?: string
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

    if (firstName && !lastName) {
      const newUser = await UpdateUserFirstName(firstName, userID.userId);
      if (!newUser) {
        throw new AppError(
          'Something Went Wrong Updating user firstName',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      return true;
    } else if (lastName && !firstName) {
      const newUser = await UpdateUserLastName(lastName, userID.userId);
      if (!newUser) {
        throw new AppError(
          'Something Went Wrong Updating user firstName',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      return true;
    } else if (firstName && lastName) {
      const newUser = await UpdateUserFullName(
        firstName,
        lastName,
        userID.userId
      );
      if (!newUser) {
        throw new AppError(
          'Something Went Wrong Updating user firstName',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      return true;
    }
    return false;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Updating user names',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

export {
  userOTPreqViaToken,
  userOTPreqViaEmail,
  PasswordResetToken,
  PasswordResetEmail,
  updateName,
};
