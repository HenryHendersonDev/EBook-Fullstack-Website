import AppError from '@/models/AppErrorModel';
import Redis from 'ioredis';
import { saveNewUserOnDB } from '../../model/auth/auth.model';
import jwtService from '@/utils/auth/jwt';
import { handleUpload, handleDelete } from '@/config/cloudinaryConfig';
import passwordService from '@/utils/auth/bcrypt';

interface Register {
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
  filePath: string | null;
}

// in this service we will get user data and save the db then return the access token.
const userRegisterService = async (user: Register, redis: Redis | null) => {
  try {
    const hashPassword = await passwordService.generate(user.password);
    user.password = hashPassword;
    if (user.filePath) {
      const { url, public_id } = await handleUpload(user.filePath);
      const data = {
        email: user.email,
        password: hashPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        filePath: url ? url : null,
        imagePublicID: public_id ? public_id : null,
      };
      try {
        const userID = await saveNewUserOnDB(data);
        const accessToken = await jwtService.sign(userID, redis);
        return accessToken;
      } catch (error) {
        await handleDelete(public_id, 'image');
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
    }
    const userID = await saveNewUserOnDB(user);
    const accessToken = await jwtService.sign(userID, redis);
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

export default userRegisterService;
