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

    const handleTypingUpdate = (payload: { socketId: string; typing: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? { ...p, typing: payload.typing, idle: false, lastSeen: Date.now() }
            : p,
        ),
      );
    };

    const handleCursorUpdate = (payload: { socketId: string; cursor: CursorPos | null }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? { ...p, cursor: payload.cursor, idle: false, lastSeen: Date.now() }
            : p,
        ),
      );
    };

    const handleSelectionUpdate = (payload: {
      socketId: string;
      selection: SelectionRange | null;
    }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? { ...p, selection: payload.selection, idle: false, lastSeen: Date.now() }
            : p,
        ),
      );
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('cursor:update', handleCursorUpdate);
    socket.on('selection:update', handleSelectionUpdate);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('cursor:update', handleCursorUpdate);
      socket.off('selection:update', handleSelectionUpdate);
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
