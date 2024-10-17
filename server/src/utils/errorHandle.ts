import AppError from '@/models/AppErrorModel';

const handleError = (error: unknown, context: string): never => {
  if (error instanceof AppError) {
    throw error;
  } else if (error instanceof Error) {
    throw new AppError(
      `An error occurred in the ${context} context.`,
      500,
      false,
      error,
      true,
      'SERVER_ERROR'
    );
  }

  const unexpectedError =
    typeof error === 'object' && error !== null
      ? JSON.stringify(error)
      : String(error);

  throw new AppError(
    `Unexpected error in ${context}. Details: ${unexpectedError}`,
    500,
    false,
    undefined,
    true,
    'UNEXPECTED_ERROR'
  );
};

export default handleError;
