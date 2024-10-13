import express from 'express';
import {
  createUserAccount,
  loginUserAccount,
  logoutUserAccount,
  reqPassResetOTPUserAccount,
} from '@/api/v1/controllers/auth.controller';
import upload from '@/config/multerConfig';

const router = express.Router();

router.post('/register', upload.single('profile'), createUserAccount);
router.post('/login', loginUserAccount);
router.post('/logout', logoutUserAccount);
router.post('/password-reset-request', reqPassResetOTPUserAccount);

export default router;
