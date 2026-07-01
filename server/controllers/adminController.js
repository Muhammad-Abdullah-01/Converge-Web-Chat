import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';

// @desc    Get Admin Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalReports = await Report.countDocuments({ status: 'pending' });
    const onlineUsers = await User.countDocuments({ status: 'online' });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalRooms,
        totalMessages,
        totalReports,
        onlineUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or delete user
// @route   PUT /api/admin/users/:userId
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  const { role } = req.body;
  const { userId } = req.params;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role selection',
    });
  }

  try {
    // Can't demote yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own administrator role',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete user's messages and reports
    await Message.deleteMany({ sender: userId });
    await Report.deleteMany({ $or: [{ reporter: userId }, { reportedUser: userId }] });
    
    // Remove user from all rooms
    await Room.updateMany(
      { participants: userId },
      { $pull: { participants: userId } }
    );

    // Delete empty rooms
    await Room.deleteMany({ participants: { $size: 0 } });

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chat rooms list
// @route   GET /api/admin/rooms
// @access  Private/Admin
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({})
      .populate('creator', '_id username email')
      .populate('participants', '_id username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat room
// @route   DELETE /api/admin/rooms/:roomId
// @access  Private/Admin
export const deleteRoom = async (req, res, next) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Delete all messages in the room
    await Message.deleteMany({ room: roomId });

    // Delete all reports related to messages in this room
    // First, find all messages in room (which is already done above, but we can do a query)
    await Report.deleteMany({
      message: { $in: await Message.find({ room: roomId }).distinct('_id') },
    });

    await Room.findByIdAndDelete(roomId);

    res.status(200).json({
      success: true,
      message: 'Chat room and all its messages deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reported messages
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({})
      .populate('reporter', '_id username email')
      .populate('reportedUser', '_id username email')
      .populate({
        path: 'message',
        populate: {
          path: 'room',
          select: '_id name isGroup',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve reported message (delete message or dismiss report)
// @route   PUT /api/admin/reports/:reportId
// @access  Private/Admin
export const resolveReport = async (req, res, next) => {
  const { reportId } = req.params;
  const { action } = req.body; // 'dismiss' or 'delete_message'

  if (!action || !['dismiss', 'delete_message'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Action must be 'dismiss' or 'delete_message'",
    });
  }

  try {
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (action === 'delete_message') {
      // Find and delete the reported message
      const message = await Message.findById(report.message);
      if (message) {
        // We'll update the text to "This message has been deleted by an administrator" or delete it completely.
        // Let's delete it completely.
        await Message.findByIdAndDelete(report.message);
      }
      
      // Update all reports for this message to resolved
      await Report.updateMany(
        { message: report.message },
        { status: 'resolved' }
      );
    } else {
      // Just mark this single report as resolved
      report.status = 'resolved';
      await report.save();
    }

    res.status(200).json({
      success: true,
      message: `Report resolved successfully with action: ${action}`,
    });
  } catch (error) {
    next(error);
  }
};
