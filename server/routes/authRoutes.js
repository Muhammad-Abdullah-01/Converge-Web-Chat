import express from 'express';
import {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.post('/forgotpassword', forgotPasswordValidator, validate, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidator, validate, resetPassword);

export default router;
