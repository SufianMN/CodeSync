import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth';
import { RoomService } from '../services/room.service';

export const registerRoomHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;

  socket.on('join-room', async (payload: { roomId: string }) => {
    try {
      const { roomId } = payload;
      if (!roomId || !userId) return;

      // Join the Socket.IO room
      socket.join(roomId);
      console.log(`Joined room ${roomId}`);

      // Fetch the latest code state from the database
      const roomState = await RoomService.getRoomCode(roomId, userId);

      // Send the state only to the socket that just joined
      socket.emit('room-state', {
        code: roomState.code,
        language: roomState.language,
      });

      socket.to(roomId).emit('user-joined', { userId }); // Optional, but good for future
    } catch (error) {
      console.error(`Error joining room: ${error}`);
      // Could emit an error event back to client if needed
    }
  });

  socket.on('leave-room', (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId) return;

    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { userId }); // Optional
  });

  socket.on('code-change', (payload: { roomId: string; code: string }) => {
    const { roomId, code } = payload;
    if (!roomId) return;

    console.log(`Server received code:update from ${socket.id} for room ${roomId}`);

    // Broadcast the update to everyone else in the room
    socket.to(roomId).emit('code-update', { code });
    console.log(`Server broadcasting code:update to room ${roomId}`);
  });

  socket.on('disconnecting', () => {
    // Optionally notify rooms the user is leaving
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('user-left', { userId });
      }
    }
  });
};
