import express from 'express';
import {
  createUserAccount,
  loginUserAccount,
  logoutUserAccount,
  reqOtoCODE,
  passwordReset,
  changeUser_Names,
  getUserInfo,
  deleteUser,
} from '@/api/v1/controllers/auth.controller';
import upload from '@/config/multerConfig';
import { csrfProtectionMiddleware } from '@/utils/auth/csrfProtection';

const router = express.Router();

router.post(
  '/register',
  csrfProtectionMiddleware,
  upload.single('profile'),
  createUserAccount
);
router.post('/login', csrfProtectionMiddleware, loginUserAccount);
router.post('/logout', csrfProtectionMiddleware, logoutUserAccount);
router.post('/otp-request', csrfProtectionMiddleware, reqOtoCODE);
router.post('/password-reset', csrfProtectionMiddleware, passwordReset);
router.post('/change-name', csrfProtectionMiddleware, changeUser_Names);
router.get('/me', getUserInfo);
router.delete('/delete-me', csrfProtectionMiddleware, deleteUser);
export default router;
