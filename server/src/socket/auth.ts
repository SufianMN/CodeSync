import { Socket } from 'socket.io';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Define the shape of our authenticated socket
export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Fastify cookie plugin normally handles parsing, but Socket.IO receives raw headers.
    // We need to manually parse the cookie from socket.handshake.headers.cookie
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      console.log('Socket connection rejected: No cookies found');
      return next(new Error('Authentication error: No cookies found'));
    }

    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map((c) => {
        const parts = c.split('=');
        return [parts[0], parts.slice(1).join('=')];
      }),
    );

    const token = cookies['token'];
    if (!token) {
      console.log('Socket connection rejected: No token found in cookies');
      return next(new Error('Authentication error: No token found'));
    }

    const payload = verifyToken(token);
    socket.user = payload;
    next();
  } catch (error) {
    console.error('Socket connection rejected: Invalid token', error);
    next(new Error('Authentication error: Invalid token'));
  }
};
