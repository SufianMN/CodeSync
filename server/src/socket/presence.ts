import { Socket } from 'socket.io';

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
  lastSeen: number;
  cursor: CursorPos | null;
  selection: SelectionRange | null;
}

const COLORS = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#4CD964',
  '#5AC8FA',
  '#007AFF',
  '#5856D6',
  '#FF2D55',
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#9575CD',
  '#7986CB',
  '#64B5F6',
  '#4FC3F7',
  '#4DD0E1',
  '#4DB6AC',
  '#81C784',
  '#AED581',
  '#DCE775',
  '#FFF176',
  '#FFD54F',
  '#FFB74D',
  '#FF8A65',
];

function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

// roomId -> socketId -> Participant
const presenceStore = new Map<string, Map<string, Participant>>();

export const PresenceManager = {
  addParticipant(roomId: string, socketId: string, userId: string, username: string) {
    if (!presenceStore.has(roomId)) {
      presenceStore.set(roomId, new Map());
    }
    const room = presenceStore.get(roomId)!;

    const participant: Participant = {
      socketId,
      userId,
      username,
      color: getColorForUser(userId),
      typing: false,
      idle: false,
      lastSeen: Date.now(),
      cursor: null,
      selection: null,
    };

    room.set(socketId, participant);
    return participant;
  },

  removeParticipant(roomId: string, socketId: string) {
    const room = presenceStore.get(roomId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        presenceStore.delete(roomId);
      }
    }
  },

  updateParticipant(roomId: string, socketId: string, updates: Partial<Participant>) {
    const room = presenceStore.get(roomId);
    if (room && room.has(socketId)) {
      const participant = room.get(socketId)!;
      Object.assign(participant, updates, { lastSeen: Date.now() });
      return participant;
    }
    return null;
  },

  getRoomParticipants(roomId: string): Participant[] {
    const room = presenceStore.get(roomId);
    if (!room) return [];
    return Array.from(room.values());
  },

  getParticipant(roomId: string, socketId: string): Participant | undefined {
    return presenceStore.get(roomId)?.get(socketId);
  },
};
