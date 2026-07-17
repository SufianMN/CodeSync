import { useEffect, useCallback } from 'react';
import { socket } from '../socket/socket';
export function useFileCollaboration(roomId: string, fileId: string | null) {
  useEffect(() => {
    if (!roomId || !fileId) return;

    // Tell the server we are viewing this file
    socket.emit('file:view', { roomId, fileId });

    return () => {
      // When unmounting or switching file, emit file:view with null (or let the new effect do it)
      // socket.emit('file:view', { roomId, fileId: null });
      // Actually we don't need to emit null on unmount because the next effect will emit the new fileId
    };
  }, [roomId, fileId]);

  const broadcastCodeChange = useCallback(
    (code: string) => {
      if (!roomId || !fileId) return;
      socket.emit('file:update', { roomId, fileId, code });
    },
    [roomId, fileId],
  );

  const broadcastCursor = useCallback(
    (cursor: any) => {
      if (!roomId || !fileId) return;
      socket.emit('file:cursor', { roomId, fileId, cursor });
    },
    [roomId, fileId],
  );

  const broadcastSelection = useCallback(
    (selection: any) => {
      if (!roomId || !fileId) return;
      socket.emit('file:selection', { roomId, fileId, selection });
    },
    [roomId, fileId],
  );

  const setTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!roomId || !fileId) return;
      socket.emit('file:typing', { roomId, fileId, isTyping });
    },
    [roomId, fileId],
  );

  return {
    broadcastCodeChange,
    broadcastCursor,
    broadcastSelection,
    setTypingStatus,
  };
}
