import { FastifyInstance } from 'fastify';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export default async function roomRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authMiddleware);

  server.post('/', RoomController.create);
  server.get('/', RoomController.list);
  server.get('/:id', RoomController.getOne);
  server.patch('/:id', RoomController.update);
  server.delete('/:id', RoomController.delete);
}
