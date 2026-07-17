import { FastifyInstance } from 'fastify';
import { WorkspaceController } from '../controllers/workspace.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function workspaceRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authMiddleware);

  // We mount this on /api/workspace in index.ts, or /api/rooms/:roomId/workspace
  // Let's assume it's mounted on /api/rooms
  server.get('/:roomId/workspace', WorkspaceController.getWorkspace);
  server.post('/:roomId/workspace', WorkspaceController.createNode);

  // These don't need roomId in the path since nodeId is unique
  server.patch('/workspace/node/:nodeId', WorkspaceController.updateNode);
  server.delete('/workspace/node/:nodeId', WorkspaceController.deleteNode);
}
