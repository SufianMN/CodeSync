import { FastifyRequest, FastifyReply } from 'fastify';
import { WorkspaceService } from '../services/workspace.service';

export class WorkspaceController {
  static async getWorkspace(
    request: FastifyRequest<{ Params: { roomId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { roomId } = request.params;
      const nodes = await WorkspaceService.getWorkspace(roomId);
      return reply.send({ success: true, data: nodes });
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ success: false, error: { message: error.message } });
    }
  }

  static async createNode(
    request: FastifyRequest<{
      Params: { roomId: string };
      Body: { parentId?: string; type: 'FILE' | 'FOLDER'; name: string; language?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { roomId } = request.params;
      const { parentId, type, name, language } = request.body;
      const node = await WorkspaceService.createNode({
        roomId,
        parentId,
        type,
        name,
        language,
      });
      return reply.code(201).send({ success: true, data: node });
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ success: false, error: { message: error.message } });
    }
  }

  static async updateNode(
    request: FastifyRequest<{
      Params: { nodeId: string };
      Body: { name?: string; parentId?: string | null; content?: string; language?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { nodeId } = request.params;
      const data = request.body;
      const node = await WorkspaceService.updateNode(nodeId, data);
      return reply.send({ success: true, data: node });
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ success: false, error: { message: error.message } });
    }
  }

  static async deleteNode(
    request: FastifyRequest<{ Params: { nodeId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { nodeId } = request.params;
      await WorkspaceService.deleteNode(nodeId);
      return reply.code(204).send();
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ success: false, error: { message: error.message } });
    }
  }
}
