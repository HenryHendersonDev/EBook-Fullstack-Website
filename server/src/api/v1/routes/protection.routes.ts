import express, { NextFunction, Request, Response } from 'express';
import { generateCustomToken } from '@/utils/auth/csrfProtection';
import AppError from '@/models/AppErrorModel';

const router = express.Router();

router.get('/csrf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await generateCustomToken(req, res);
    res.json({ token });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'An unexpected error occurred while generating CSRF token',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
});

export default router;
