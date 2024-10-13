import express from 'express';
import {
  createUserAccount,
  loginUserAccount,
} from '@/api/v1/controllers/auth.controller';
import upload from '@/config/multerConfig';

const router = express.Router();

router.post('/register', upload.single('profile'), createUserAccount);
router.post('/login', upload.single('profile'), loginUserAccount);

export default router;
