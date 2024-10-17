import { Request, Response, NextFunction } from 'express';
import AppError from '@/models/AppErrorModel';
import { APPLICATION_CONFIG } from '@/config/applicationConfig';
import setErrorDB from '@/models/errorMode';
import { format } from 'date-fns';

interface ErrorDetails {
  name: string;
  message: string;
  cause: string | null;
  statusCode?: number;
  isOperational?: boolean;
  isUnExpectedError?: boolean;
  isAppError: boolean;
  originalError: ErrorDetails | string;
  code?: string;
  stack?: string;
  timestamp?: string;
  request?: {
    url: string;
    method: string;
  };
}

const formatDateTime = () => {
  try {
    const date = new Date();
    return format(date, 'yyyy-MM-dd hh:mm:ss aa');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'An unexpected error occurred while formatting the date and time in Date Utils. Please try again.',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected An unexpected error occurred: ${error}`);
  }
};

const formatError = (error: Error | AppError, req?: Request): ErrorDetails => {
  const errorDetails: ErrorDetails = {
    name: error.name,
    message: error.message,
    cause: typeof error.cause === 'string' ? error.cause : 'N/A',
    isAppError: false,
    originalError: 'N/A',
    code: 'N/A',
    stack: error.stack,
    timestamp: formatDateTime(),
  };

  if (req) {
    errorDetails.request = {
      url: req.url,
      method: req.method,
    };
  }

  if (error instanceof AppError) {
    errorDetails.statusCode = error.statusCode;
    errorDetails.isOperational = error.isOperational;
    errorDetails.isUnExpectedError = error.isUnExpectedError;
    errorDetails.isAppError = true;
    errorDetails.originalError = error.originalError
      ? formatError(error.originalError)
      : 'N/A';
    errorDetails.code = error.code ? error.code : 'N/A';
  }

  return errorDetails;
};

const controlError = async (
  error: ErrorDetails | string,
  risk: string,
  type: string
) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorDetails = typeof error === 'string' ? '{}' : JSON.stringify(error);
  // @ts-expect-error it's okay
  await setErrorDB(type, errorMessage, risk, errorDetails);
};

const handleError = async (
  error: Error,
  req?: Request
): Promise<{ message: string; status: number; code: string }> => {
  try {
    const formattedError = formatError(error, req);
    if (
      error instanceof Error &&
      'code' in error &&
      APPLICATION_CONFIG.USE_CSRF
    ) {
      if (error.code === 'EBADCSRFTOKEN') {
        return {
          message:
            'Invalid or missing CSRF token. Please refresh the page and try again.',
          status: 403,
          code: 'INVALID_CSRF_TOKEN',
        };
      }
    }
    if (APPLICATION_CONFIG.CONSOLE_APP_ERROR) {
      console.log(error);
    }
    if (error instanceof AppError) {
      if (!error.isOperational) {
        await controlError(formattedError, 'High', 'Non Operational');
      }
      return {
        message: error.isOperational
          ? error.message
          : 'A server error occurred.',
        status: error.statusCode || 500,
        code: error.isOperational && error.code ? error.code : 'SERVER_ERROR',
      };
    }

    await controlError(formattedError, 'Low', 'Unexpected');
    return {
      message: 'An unexpected error occurred',
      status: 500,
      code: 'UNEXPECTED_ERROR',
    };
  } catch (err) {
    return {
      message: 'An unexpected error occurred',
      status: 500,
      code: 'UNEXPECTED_ERROR',
    };
  }
};

process.on('unhandledRejection', (reason: Error | never) => {
  const formattedError = formatError(reason);
  controlError(formattedError, 'High', 'unhandledRejection');
});

process.on('uncaughtException', (error: Error) => {
  const formattedError = formatError(error);
  controlError(formattedError, 'High', 'uncaughtException');
  process.exit(1);
});

const errorMiddleware = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { message, code, status } = await handleError(err, req);
  if (code === 'UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN') {
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      signed: true,
      expires: new Date(0),
      path: '/',
    });
  }
  res.status(status).json({ message, code });
};

export default errorMiddleware;
