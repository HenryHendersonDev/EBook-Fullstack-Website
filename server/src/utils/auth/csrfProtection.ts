import { APPLICATION_CONFIG } from '@/config/applicationConfig';
import AppError from '@/models/AppErrorModel';
import { doubleCsrf } from 'csrf-csrf';
import { NextFunction, Response, Request } from 'express';

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => process.env['CSRF_KEY'] || 'defaultValCSRF',
  cookieName: 'csrf-Token',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: process.env['NODE_ENV'] === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

const generateCustomToken = async (req: Request, res: Response) => {
  try {
    const csrfToken = generateToken(req, res);
    return csrfToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'An unexpected error occurred while generating CSRF token ',
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

const csrfProtectionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!APPLICATION_CONFIG.USE_CSRF) {
    return next();
  }
  try {
    return doubleCsrfProtection(req, res, next);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'An unexpected error occurred while Verifying CSRF Token ',
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

export { generateCustomToken, csrfProtectionMiddleware };
