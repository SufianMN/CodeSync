import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth';
import { RoomService } from '../services/room.service';
import { PresenceManager } from './presence';
import { prisma } from '../utils/prisma';

export const registerRoomHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;

  socket.on('join-room', async (payload: { roomId: string }) => {
    try {
      const { roomId } = payload;
      if (!roomId || !userId) return;

      // Join the Socket.IO room
      socket.join(roomId);
      console.log(`Joined room ${roomId}`);

      // Fetch user details
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        PresenceManager.addParticipant(roomId, socket.id, userId, user.name);
      }

      // Fetch the latest code state from the database
      const roomState = await RoomService.getRoomCode(roomId, userId);

      // Send the state only to the socket that just joined
      socket.emit('room-state', {
        code: roomState.code,
        language: roomState.language,
      });

      // Broadcast updated presence to the room
      io.to(roomId).emit('presence:update', PresenceManager.getRoomParticipants(roomId));
    } catch (error) {
      console.error(`Error joining room: ${error}`);
    }
  });

  socket.on('leave-room', (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId) return;

    socket.leave(roomId);
    PresenceManager.removeParticipant(roomId, socket.id);
    io.to(roomId).emit('presence:update', PresenceManager.getRoomParticipants(roomId));
  });

  socket.on('code-change', (payload: { roomId: string; code: string }) => {
    const { roomId, code } = payload;
    if (!roomId) return;

    console.log(`Server received code:update from ${socket.id} for room ${roomId}`);

    // Broadcast the update to everyone else in the room
    socket.to(roomId).emit('code-update', { code });
    console.log(`Server broadcasting code:update to room ${roomId}`);
  });

  socket.on('cursor:update', (payload: { roomId: string; cursor: any }) => {
    const { roomId, cursor } = payload;
    if (!roomId) return;
    PresenceManager.updateParticipant(roomId, socket.id, { cursor, idle: false });
    io.to(roomId).emit('cursor:update', { socketId: socket.id, cursor });
  });

  socket.on('selection:update', (payload: { roomId: string; selection: any }) => {
    const { roomId, selection } = payload;
    if (!roomId) return;
    PresenceManager.updateParticipant(roomId, socket.id, { selection, idle: false });
    io.to(roomId).emit('selection:update', { socketId: socket.id, selection });
  });

  socket.on('typing:start', (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId) return;
    PresenceManager.updateParticipant(roomId, socket.id, { typing: true, idle: false });
    io.to(roomId).emit('typing:update', { socketId: socket.id, typing: true });
  });

  socket.on('typing:stop', (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId) return;
    PresenceManager.updateParticipant(roomId, socket.id, { typing: false });
    io.to(roomId).emit('typing:update', { socketId: socket.id, typing: false });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        PresenceManager.removeParticipant(room, socket.id);
        io.to(room).emit('presence:update', PresenceManager.getRoomParticipants(room));
      }
    }
  });
};
