import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import {
  deleteSession,
  deleteUser,
  findOTPCode,
  findUserOnDB,
  findUserOnDBviaSessionID,
} from '../../model/auth/auth.model';
import jwtService from '@/utils/auth/jwt';

// in this service we will get user Cookie and Remove session stored on to that access token then remove cookie from user browser.
const userLogoutService = async (
  accessToken: string,
  redis: Redis | null
): Promise<boolean> => {
  try {
    const userSession = jwtService.verify(accessToken, false);
    if (!userSession) {
      throw new AppError(
        'User Not Found',
        401,
        true,
        undefined,
        false,
        'UNAUTHORIZED_INVALID_TOKEN'
      );
    }
    await deleteSession(userSession.id, redis);
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Logging OUT user',
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

// in this service we will get the user Access Token Then Verifiy it after We Gonna Delete The User Account.
const userDeleteService = async (
  accessToken: string,
  otp: string,
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
    const isValidateOTP = await findOTPCode(userID.userId, otp, redis);
    if (!isValidateOTP) {
      throw new AppError(
        'OTP code is Invalid',
        400,
        true,
        undefined,
        false,
        'INVALID_OTP'
      );
    }
    const delUser = await deleteUser(userID.userId, redis);
    if (!delUser) {
      throw new AppError(
        'Something Went Wrong While Deleting The user',
        500,
        true,
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
        'Something Went Wrong While Logging OUT user',
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

export { userLogoutService, userDeleteService };
