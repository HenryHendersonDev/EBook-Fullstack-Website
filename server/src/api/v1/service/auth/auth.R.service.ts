import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import jwtService from '@/utils/auth/jwt';
import passwordService from '@/utils/auth/bcrypt';
import {
  findUserOnDB,
  findUserOnDBViaIdPUBLIC_DATA,
  findUserOnDBviaSessionID,
} from '../../model/auth/auth.R.model';

interface Login {
  email: string;
  password: string;
}

// in this service we will get user data and and check if true we will return cookie.
const userLoginService = async (
  user: Login,
  redis: Redis | null
): Promise<string> => {
  try {
    const DBuser = await findUserOnDB(user.email);
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
    const checkPassword = await passwordService.verify(
      user.password,
      DBuser.password
    );
    if (!checkPassword) {
      throw new AppError(
        'Invalid Password',
        400,
        true,
        undefined,
        false,
        'INVALID_PASSWORD'
      );
    }
    const accessToken = await jwtService.sign(DBuser.id, redis);
    return accessToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While LOGGING IN user',
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

interface PublicDATA {
  email: string;
  firstName: string;
  lastName: string | null;
}

// in this service we will get user data and Return.
const getUserDataService = async (
  accessToken: string,
  redis: Redis | null
): Promise<PublicDATA> => {
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
    const PublicData = await findUserOnDBViaIdPUBLIC_DATA(userID.userId);
    if (!PublicData) {
      throw new AppError(
        'User Not Found',
        404,
        true,
        undefined,
        false,
        'USER_NOT_FOUND'
      );
    }
    return PublicData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something Went Wrong While Getting User Public Data',
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

export { userLoginService, getUserDataService };
