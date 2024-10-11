class AppError extends Error {
  public statusCode: number;

  public isOperational: boolean;

  public originalError?: Error;

  public isUnExpectedError?: boolean;

  public code?: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    originalError?: Error,
    isUnExpectedError = false,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.originalError = originalError;
    this.isUnExpectedError = isUnExpectedError;
    if (isOperational && code) {
      this.code = code;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
