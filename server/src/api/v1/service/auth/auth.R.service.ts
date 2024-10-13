import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import { findUserOnDB } from '../../model/auth/auth.model';
import jwtService from '@/utils/auth/jwt';
import passwordService from '@/utils/auth/bcrypt';

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

export default userLoginService;
