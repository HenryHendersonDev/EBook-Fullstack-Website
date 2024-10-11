import AppError from '@/models/AppErrorModel';
import bcrypt from 'bcrypt';

interface IPasswordService {
  generate(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<string>;
}

class PasswordService implements IPasswordService {
  private handleError(error: unknown, context: string): never {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        `Something Went Wrong At ${context}`,
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
  async generate(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      const hash = await bcrypt.hash(password, saltRounds);
      return hash;
    } catch (error) {
      this.handleError(error, 'Password Hashing');
    }
  }
  async verify(password: string, hash: string): Promise<string> {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      this.handleError(error, 'Password Hash verify');
    }
  }
}

const passwordService = new PasswordService();

export default passwordService;
