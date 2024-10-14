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

const router = express.Router();

router.post('/register', upload.single('profile'), createUserAccount);
router.post('/login', loginUserAccount);
router.post('/logout', logoutUserAccount);
router.post('/otp-request', reqOtoCODE);
router.post('/password-reset', passwordReset);
router.post('/change-name', changeUser_Names);
router.get('/me', getUserInfo);
router.delete('/delete-me', deleteUser);

export default router;
