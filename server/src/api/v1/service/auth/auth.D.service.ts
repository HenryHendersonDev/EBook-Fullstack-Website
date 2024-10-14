import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import { deleteSession, findUserOnDB } from '../../model/auth/auth.model';
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
        'SYSTEM_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

export default userLogoutService;
