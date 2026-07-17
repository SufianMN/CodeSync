import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth';
import { RoomService } from '../services/room.service';
import { PresenceManager } from './presence';
import { prisma } from '../utils/prisma';
import { ChatService } from '../services/chat.service';
import { sendChatMessageSchema } from '../schemas/chat.schema';

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

      // Broadcast updated presence to the room
      io.to(roomId).emit('presence:update', PresenceManager.getRoomParticipants(roomId));

      // Emit system message
      if (user) {
        socket.to(roomId).emit('system:message', { type: 'join', username: user.name });
      }
    } catch (error) {
      console.error(`Error joining room: ${error}`);
    }
  });

  socket.on('leave-room', (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId) return;

    const participant = PresenceManager.getParticipant(roomId, socket.id);
    if (participant) {
      socket.to(roomId).emit('system:message', { type: 'leave', username: participant.username });
    }

    socket.leave(roomId);
    PresenceManager.removeParticipant(roomId, socket.id);
    io.to(roomId).emit('presence:update', PresenceManager.getRoomParticipants(roomId));
  });

  socket.on('file:view', (payload: { roomId: string; fileId: string | null }) => {
    const { roomId, fileId } = payload;
    if (!roomId) return;
    PresenceManager.updateParticipant(roomId, socket.id, { activeFileId: fileId, idle: false });
    io.to(roomId).emit('presence:update', PresenceManager.getRoomParticipants(roomId));
  });

  socket.on('file:update', (payload: { roomId: string; fileId: string; code: string }) => {
    const { roomId, fileId, code } = payload;
    if (!roomId || !fileId) return;
    socket.to(roomId).emit('file:update', { fileId, socketId: socket.id, code });
  });

  socket.on('file:cursor', (payload: { roomId: string; fileId: string; cursor: any }) => {
    const { roomId, fileId, cursor } = payload;
    if (!roomId || !fileId) return;
    PresenceManager.updateParticipant(roomId, socket.id, {
      cursor,
      activeFileId: fileId,
      idle: false,
    });
    io.to(roomId).emit('file:cursor', { fileId, socketId: socket.id, cursor });
  });

  socket.on('file:selection', (payload: { roomId: string; fileId: string; selection: any }) => {
    const { roomId, fileId, selection } = payload;
    if (!roomId || !fileId) return;
    PresenceManager.updateParticipant(roomId, socket.id, {
      selection,
      activeFileId: fileId,
      idle: false,
    });
    io.to(roomId).emit('file:selection', { fileId, socketId: socket.id, selection });
  });

  socket.on('file:typing', (payload: { roomId: string; fileId: string; isTyping: boolean }) => {
    const { roomId, fileId, isTyping } = payload;
    if (!roomId || !fileId) return;
    PresenceManager.updateParticipant(roomId, socket.id, {
      typing: isTyping,
      activeFileId: fileId,
      idle: false,
    });
    io.to(roomId).emit('file:typing', { fileId, socketId: socket.id, isTyping });
  });

  socket.on('chat:send', async (payload: { roomId: string; content: string }) => {
    try {
      const { roomId, content } = payload;
      if (!roomId || !userId) return;

      const validated = sendChatMessageSchema.parse({ content });
      const message = await ChatService.sendMessage(roomId, userId, validated);

      io.to(roomId).emit('chat:new', message);
    } catch (error) {
      console.error(`Error sending chat message: ${error}`);
    }
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        const participant = PresenceManager.getParticipant(room, socket.id);
        if (participant) {
          socket.to(room).emit('system:message', { type: 'leave', username: participant.username });
        }
        PresenceManager.removeParticipant(room, socket.id);
        io.to(room).emit('presence:update', PresenceManager.getRoomParticipants(room));
      }
    }
  });
};
