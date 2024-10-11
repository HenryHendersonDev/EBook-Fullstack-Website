import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import AppError from '@/models/AppErrorModel';

const cookieParserSet =
  () => (req: Request, res: Response, next: NextFunction) => {
    const { COOKIE_SECRET } = process.env;

    // Validate the cookie secret
    if (!COOKIE_SECRET) {
      const error = new AppError(
        'Cookie secret not set',
        500,
        false,
        undefined,
        false,
        'SERVER_ERROR'
      );
      return next(error);
    }

    // Use cookie parser if cookie secret is set
    try {
      return cookieParser(COOKIE_SECRET)(req, res, next);
    } catch (error) {
      // Log unexpected errors
      console.error('Error parsing cookies:', error);

      // Handle unexpected errors
      return next(
        new AppError(
          'An unexpected error occurred during cookie parsing',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        )
      );
    }
  };

export default cookieParserSet;
