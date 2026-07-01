import { verifyAccessToken } from '../services/tokenService.js';
import User from '../models/User.js';
import registerSocketEvents from './socketEvents.js';

const initSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      // Verify token
      const decoded = verifyAccessToken(token);
      
      // Fetch user from DB to verify they still exist
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket instance
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Register event handlers
    registerSocketEvents(io, socket);
  });
};

export default initSocket;
