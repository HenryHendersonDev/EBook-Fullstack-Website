import express, { NextFunction, Request, Response } from 'express';
import authRoute from '@/api/v1/routes/auth.routes';
import protection from '@/api/v1/routes/protection.routes';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/protection', protection);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('Hello World!');
});

export default router;
