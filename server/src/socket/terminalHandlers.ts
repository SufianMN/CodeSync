import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from './auth';
import { ExecuteService } from '../services/execute.service';
import { prisma } from '../utils/prisma';

export const registerTerminalHandlers = (io: Server, socket: AuthenticatedSocket) => {
  // Store the active terminal input handler so we can pipe data to it
  let activeTerminalInput: ((input: string) => void) | null = null;

  socket.on(
    'terminal:execute',
    async (
      payload: { roomId: string; fileId: string; language: string; code: string },
      callback: (res: { success: boolean; error?: string }) => void,
    ) => {
      try {
        const { roomId, fileId, language, code } = payload;

        const userId = socket.user?.userId;
        if (!userId) {
          return callback({ success: false, error: 'Unauthorized' });
        }

        // Check access
        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId } },
        });
        if (!member) {
          return callback({ success: false, error: 'Unauthorized' });
        }

        // Notify client that stream is starting
        socket.emit('terminal:start', { fileId });

        // Clean up any existing execution for this socket
        if (activeTerminalInput) {
          activeTerminalInput = null;
        }

        const handleInput = await ExecuteService.streamCode(
          language as any,
          code,
          (outputData) => {
            socket.emit('terminal:output', { data: outputData });
          },
          (exitCode) => {
            socket.emit('terminal:exit', { exitCode });
            activeTerminalInput = null;
          },
        );

        activeTerminalInput = handleInput;
        callback({ success: true });
      } catch (err: any) {
        console.error('Terminal execute error:', err);
        callback({ success: false, error: err.message });
      }
    },
  );

  socket.on('terminal:input', (payload: { data: string }) => {
    if (activeTerminalInput) {
      activeTerminalInput(payload.data);
    }
  });

  socket.on('disconnect', () => {
    activeTerminalInput = null;
  });
};
