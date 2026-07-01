import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

// Map to track active socket connections by user ID
// Helpful to check if a user has multiple active connections
const activeUsers = new Map();

const registerSocketEvents = (io, socket) => {
  const userId = socket.user._id.toString();
  
  // Track connection
  if (!activeUsers.has(userId)) {
    activeUsers.set(userId, new Set());
  }
  activeUsers.get(userId).add(socket.id);

  // Set user to online and notify contacts
  updateUserStatus(userId, 'online');

  // Join personal user room for one-to-one targeted events
  socket.join(userId);

  // 1. Join Chat Room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.user.username} joined room: ${roomId}`);
  });

  // 2. Leave Chat Room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.user.username} left room: ${roomId}`);
  });

  // 3. Send Message
  socket.on('send_message', async ({ roomId, text }) => {
    try {
      if (!text || !roomId) return;

      // Create and save message
      let message = await Message.create({
        room: roomId,
        sender: socket.user._id,
        text,
        status: 'sent',
        readBy: [socket.user._id],
        deliveredTo: [socket.user._id],
      });

      message = await message.populate('sender', '_id username email avatar status');

      // Update room timestamp for sorting lists
      await Room.findByIdAndUpdate(roomId, { updatedAt: Date.now() });

      // Broadcast to room
      io.to(roomId).emit('message_received', message);
    } catch (error) {
      console.error('Error sending socket message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // 4. Typing Indicator
  socket.on('typing', ({ roomId }) => {
    socket.to(roomId).emit('user_typing', {
      userId: socket.user._id,
      username: socket.user.username,
      roomId,
    });
  });

  // 5. Stop Typing Indicator
  socket.on('stop_typing', ({ roomId }) => {
    socket.to(roomId).emit('user_stop_typing', {
      userId: socket.user._id,
      roomId,
    });
  });

  // 6. Mark Messages as Read
  socket.on('mark_read', async ({ roomId, messageIds }) => {
    try {
      if (!messageIds || !messageIds.length) return;

      await Message.updateMany(
        { _id: { $in: messageIds }, room: roomId },
        { 
          $addToSet: { readBy: socket.user._id },
          $set: { status: 'read' }
        }
      );

      // Emit read receipt details back to the room
      socket.to(roomId).emit('messages_read_receipt', {
        roomId,
        readerId: socket.user._id,
        messageIds,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // 7. Mark Messages as Delivered
  socket.on('mark_delivered', async ({ roomId, messageIds }) => {
    try {
      if (!messageIds || !messageIds.length) return;

      await Message.updateMany(
        { _id: { $in: messageIds }, room: roomId },
        { 
          $addToSet: { deliveredTo: socket.user._id },
          $set: { status: 'delivered' }
        }
      );

      socket.to(roomId).emit('messages_delivered_receipt', {
        roomId,
        receiverId: socket.user._id,
        messageIds,
      });
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
    }
  });

  // 8. Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
    
    const userSockets = activeUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        activeUsers.delete(userId);
        // Only set status offline if they have no active socket connections left
        updateUserStatus(userId, 'offline');
      }
    }
  });

  // Helper function to update status in DB and broadcast to all users
  async function updateUserStatus(uid, status) {
    try {
      const updateData = { status };
      if (status === 'offline') {
        updateData.lastSeen = Date.now();
      }
      
      await User.findByIdAndUpdate(uid, updateData);
      
      io.emit('user_status_changed', {
        userId: uid,
        status,
        lastSeen: status === 'offline' ? new Date() : null,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }
};

export default registerSocketEvents;
