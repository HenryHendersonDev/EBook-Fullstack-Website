import prisma from '@/config/prismaClientConfig';
import AppError from '@/models/AppErrorModel';

const setErrorDB = async (
  type: string,
  errorMessage: string,
  risk: string,
  errorDetails: never
) => {
  try {
    if (!prisma) return null;
    const newError = await prisma.errorLog.create({
      data: {
        errorType: type,
        errorMessage,
        risk,
        errorDetails,
      },
    });
    return newError;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'An unexpected error occurred while Creating New Error Records On Database',
        500,
        false,
        error,
        true
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

export default setErrorDB;
