import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export default async function authRoutes(server: FastifyInstance) {
  server.post('/register', AuthController.register);
  server.post('/login', AuthController.login);
  server.post('/google', AuthController.googleLogin);
  server.post('/logout', { preHandler: [authMiddleware] }, AuthController.logout);
  server.get('/me', { preHandler: [authMiddleware] }, AuthController.me);
}
