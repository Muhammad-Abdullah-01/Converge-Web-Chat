import express from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  searchUsers,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.get('/search', searchUsers);

export default router;
