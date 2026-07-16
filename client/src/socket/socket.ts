import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true, // Send cookies
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});
