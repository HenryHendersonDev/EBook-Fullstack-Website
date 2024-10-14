import express from 'express';
import {
  createUserAccount,
  loginUserAccount,
  logoutUserAccount,
  reqPassResetOTPUserAccount,
  passwordReset,
  changeUser_Names,
  getUserInfo,
} from '@/api/v1/controllers/auth.controller';
import upload from '@/config/multerConfig';

const router = express.Router();

router.post('/register', upload.single('profile'), createUserAccount);
router.post('/login', loginUserAccount);
router.post('/logout', logoutUserAccount);
router.post('/password-reset-request', reqPassResetOTPUserAccount);
router.post('/password-reset', passwordReset);
router.post('/change-name', changeUser_Names);
router.post('/me', getUserInfo);

export default router;
