import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket/socket';
import toast from 'react-hot-toast';

export interface CursorPos {
  line: number;
  column: number;
}

export interface SelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface Participant {
  socketId: string;
  userId: string;
  username: string;
  color: string;
  typing: boolean;
  idle: boolean;
  lastSeen?: number;
  cursor: CursorPos | null;
  selection: SelectionRange | null;
  activeFileId: string | null;
}

export function usePresence(roomId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const prevParticipantsRef = useRef<Participant[]>([]);

  useEffect(() => {
    prevParticipantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    if (!roomId) return;

    const handlePresenceUpdate = (updatedParticipants: Participant[]) => {
      const prev = prevParticipantsRef.current;
      const prevIds = new Set(prev.map((p) => p.socketId));
      const currentIds = new Set(updatedParticipants.map((p) => p.socketId));

      updatedParticipants.forEach((p) => {
        if (!prevIds.has(p.socketId) && p.socketId !== socket.id) {
          toast(`${p.username} joined the room`, { icon: '👋' });
        }
      });

      prev.forEach((p) => {
        if (!currentIds.has(p.socketId) && p.socketId !== socket.id) {
          toast(`${p.username} left the room`, { icon: '🚶' });
        }
      });

      // Maintain lastSeen or initialize it
      setParticipants(
        updatedParticipants.map((p) => {
          const existing = prev.find((x) => x.socketId === p.socketId);
          return { ...p, lastSeen: existing?.lastSeen || Date.now() };
        }),
      );
    };

    const handleTypingUpdate = (payload: {
      fileId: string;
      socketId: string;
      isTyping: boolean;
    }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? {
                ...p,
                typing: payload.isTyping,
                idle: false,
                lastSeen: Date.now(),
                activeFileId: payload.fileId,
              }
            : p,
        ),
      );
    };

    const handleCursorUpdate = (payload: {
      fileId: string;
      socketId: string;
      cursor: CursorPos | null;
    }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? {
                ...p,
                cursor: payload.cursor,
                idle: false,
                lastSeen: Date.now(),
                activeFileId: payload.fileId,
              }
            : p,
        ),
      );
    };

    const handleSelectionUpdate = (payload: {
      fileId: string;
      socketId: string;
      selection: SelectionRange | null;
    }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? {
                ...p,
                selection: payload.selection,
                idle: false,
                lastSeen: Date.now(),
                activeFileId: payload.fileId,
              }
            : p,
        ),
      );
    };

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      socket.emit('join-room', { roomId });
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('file:typing', handleTypingUpdate);
    socket.on('file:cursor', handleCursorUpdate);
    socket.on('file:selection', handleSelectionUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('file:typing', handleTypingUpdate);
      socket.off('file:cursor', handleCursorUpdate);
      socket.off('file:selection', handleSelectionUpdate);

      socket.emit('leave-room', { roomId });
    };
  }, [roomId]);

  // Idle detection loop
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

    const interval = setInterval(() => {
      const now = Date.now();
      setParticipants((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (!p.idle && p.lastSeen && now - p.lastSeen >= IDLE_TIMEOUT_MS) {
            changed = true;
            return { ...p, idle: true, typing: false };
          }
          return p;
        });
        return changed ? next : prev;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return { participants };
}
