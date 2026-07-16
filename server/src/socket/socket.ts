import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { socketAuthMiddleware, AuthenticatedSocket } from './auth';
import { registerRoomHandlers } from './roomHandlers';

export const initializeSocket = (fastify: FastifyInstance) => {
  const io = new Server(fastify.server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Apply authentication middleware
  io.use((socket, next) => {
    socketAuthMiddleware(socket as AuthenticatedSocket, next);
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    const authSocket = socket as AuthenticatedSocket;

    // Register handlers
    registerRoomHandlers(io, authSocket);

    socket.on('disconnect', () => {
      // Cleanup handled implicitly, can add logging if desired
    });
  });

  return io;
};
