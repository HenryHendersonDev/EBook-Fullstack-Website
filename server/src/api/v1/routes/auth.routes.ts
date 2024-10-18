import express from 'express';
import upload from '@/config/multerConfig';
import { csrfProtectionMiddleware } from '@/utils/auth/csrfProtection';
import {
  getUserInfo,
  loginUserAccount,
  validateAccountVerification,
} from '../controllers/auth/auth.R.controller';
import {
  deleteUser,
  logoutUserAccount,
} from '../controllers/auth/auth.D.controller';
import { reqOtoCODE } from '../controllers/auth/auth.otp.controller';
import {
  changeUser_Names,
  passwordReset,
} from '../controllers/auth/auth.U.controller';
import {
  createUserAccount,
  sendVerificationEmailController,
} from '../controllers/auth/auth.C.controller';
import {
  createTotp,
  removeTotpUsingEmail,
  removeTotpUsingTotp,
  verifyTotp,
} from '../controllers/auth/auth.2fa.controller';

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

router.post('/generate-Totp', csrfProtectionMiddleware, createTotp);
router.post('/verify-Totp', csrfProtectionMiddleware, verifyTotp);
router.post(
  '/remove-Totp/email',
  csrfProtectionMiddleware,
  removeTotpUsingEmail
);

router.post('/remove-Totp/Totp', csrfProtectionMiddleware, removeTotpUsingTotp);

router.post(
  '/email-Verification-req',
  csrfProtectionMiddleware,
  sendVerificationEmailController
);

router.get('/email-Verification-check', validateAccountVerification);

export default router;
