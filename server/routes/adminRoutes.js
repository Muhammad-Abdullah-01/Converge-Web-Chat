import express from 'express';
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getRooms,
  deleteRoom,
  getReports,
  resolveReport,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all admin routes with JWT auth and Administrator authorization
router.use(protect, admin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:userId', updateUserRole);
router.delete('/users/:userId', deleteUser);
router.get('/rooms', getRooms);
router.delete('/rooms/:roomId', deleteRoom);
router.get('/reports', getReports);
router.put('/reports/:reportId', resolveReport);

export default router;
