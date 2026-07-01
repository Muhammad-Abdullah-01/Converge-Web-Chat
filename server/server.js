import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import initSocket from './sockets/socketHandler.js';

// Connect to Database
connectDB();

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io Server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configure sockets
initSocket(io);

// Start server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
