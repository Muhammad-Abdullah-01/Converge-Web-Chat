import express from 'express';
import {
  getOrCreatePrivateChat,
  createGroupRoom,
  getRooms,
  getRoomMessages,
  reportMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected
router.use(protect);

router.post('/private', getOrCreatePrivateChat);
router.post('/group', createGroupRoom);
router.get('/rooms', getRooms);
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/messages/:messageId/report', reportMessage);

export default router;
