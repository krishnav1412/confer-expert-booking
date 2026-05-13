import { Server } from 'socket.io';
import { verifyToken } from '../middleware/authMiddleware.js';

let io = null;

export const initSocket = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      credentials: true,
    },
  });

  // Soft auth — attach userId if a valid token is provided
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer /, '');
    if (token) {
      try {
        const payload = verifyToken(token);
        socket.userId = payload.sub;
      } catch {
        // ignore — anonymous viewing is allowed
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('joinExpertRoom', (expertId) => {
      if (typeof expertId === 'string' && /^[0-9a-fA-F]{24}$/.test(expertId)) {
        socket.join(`expert:${expertId}`);
      }
    });
    socket.on('leaveExpertRoom', (expertId) => {
      if (typeof expertId === 'string') socket.leave(`expert:${expertId}`);
    });
  });

  return io;
};

export const emitSlotBooked = (expertId, payload) => {
  if (!io) return;
  io.to(`expert:${expertId}`).emit('slotBooked', payload);
};

export const getIo = () => io;
