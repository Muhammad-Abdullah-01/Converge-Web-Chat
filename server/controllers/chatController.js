import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

// @desc    Get or create private chat room with another user
// @route   POST /api/chat/private
// @access  Private
export const getOrCreatePrivateChat = async (req, res, next) => {
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({
      success: false,
      message: 'Recipient ID is required',
    });
  }

  try {
    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found',
      });
    }

    // Check if room already exists
    let room = await Room.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, recipientId] },
    }).populate('participants', '_id username email avatar status lastSeen');

    if (!room) {
      // Create new private room
      room = await Room.create({
        isGroup: false,
        participants: [req.user._id, recipientId],
      });
      room = await room.populate('participants', '_id username email avatar status lastSeen');
    }

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new group room
// @route   POST /api/chat/group
// @access  Private
export const createGroupRoom = async (req, res, next) => {
  const { name, participants, description, avatar } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Group name is required',
    });
  }

  try {
    // Add current user to participant list
    const roomParticipants = [...new Set([req.user._id.toString(), ...(participants || [])])];

    if (roomParticipants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A group must have at least 2 participants',
      });
    }

    // Verify participants exist
    const usersExist = await User.find({ _id: { $in: roomParticipants } });
    if (usersExist.length !== roomParticipants.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participant IDs are invalid',
      });
    }

    const room = await Room.create({
      name,
      isGroup: true,
      participants: roomParticipants,
      creator: req.user._id,
      description,
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });

    const populatedRoom = await Room.findById(room._id).populate(
      'participants',
      '_id username email avatar status lastSeen'
    );

    res.status(201).json({
      success: true,
      room: populatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms of current user
// @route   GET /api/chat/rooms
// @access  Private
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({
      participants: req.user._id,
    })
      .populate('participants', '_id username email avatar status lastSeen')
      .populate('creator', '_id username')
      .sort({ updatedAt: -1 });

    // For each room, append the last message
    const roomsWithLastMessage = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await Message.findOne({ room: room._id })
          .populate('sender', '_id username avatar')
          .sort({ createdAt: -1 });

        return {
          ...room.toObject(),
          lastMessage,
        };
      })
    );

    // Sort rooms again by the timestamp of their last message (or creation if no message exists)
    roomsWithLastMessage.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
      return bTime - aTime;
    });

    res.status(200).json({
      success: true,
      rooms: roomsWithLastMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get message history for a room
// @route   GET /api/chat/rooms/:roomId/messages
// @access  Private
export const getRoomMessages = async (req, res, next) => {
  const { roomId } = req.params;

  try {
    // Verify room exists and user is a participant
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room',
      });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', '_id username email avatar status')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a message
// @route   POST /api/chat/messages/:messageId/report
// @access  Private
export const reportMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason for reporting is required',
    });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if report already exists from this user for this message
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      message: messageId,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this message',
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: message.sender,
      message: messageId,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Message reported successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};
