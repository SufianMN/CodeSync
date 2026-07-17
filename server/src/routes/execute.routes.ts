import { FastifyInstance } from 'fastify';
import { ExecuteController } from '../controllers/execute.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function executeRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authMiddleware] }, ExecuteController.executeCode);
}
