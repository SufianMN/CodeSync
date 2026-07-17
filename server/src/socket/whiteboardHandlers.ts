import { Socket } from 'socket.io';
import { prisma } from '../utils/prisma';

export const registerWhiteboardHandlers = (socket: Socket) => {
  // Client requests the latest snapshot when joining the whiteboard
  socket.on('whiteboard:join', async (roomId: string) => {
    try {
      const snapshot = await prisma.whiteboardSnapshot.findUnique({
        where: { roomId },
      });
      if (snapshot) {
        socket.emit('whiteboard:init', snapshot.data);
      }
    } catch (error) {
      console.error('Error fetching whiteboard snapshot:', error);
    }
  });

  // Client broadcasts incremental tldraw updates to other clients in the room
  socket.on('whiteboard:update', ({ roomId, changes }: { roomId: string; changes: any }) => {
    socket.to(roomId).emit('whiteboard:update', { changes });
  });

  // Client periodically saves the full snapshot
  socket.on(
    'whiteboard:save',
    async (
      { roomId, data }: { roomId: string; data: string },
      callback?: (success: boolean) => void,
    ) => {
      try {
        await prisma.whiteboardSnapshot.upsert({
          where: { roomId },
          update: { data },
          create: { roomId, data },
        });
        if (callback) callback(true);
      } catch (error) {
        console.error('Error saving whiteboard snapshot:', error);
        if (callback) callback(false);
      }
    },
  );
};
