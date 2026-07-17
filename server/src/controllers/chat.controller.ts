import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from '../services/chat.service';

export class ChatController {
  static async getRoomMessages(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { roomId } = request.params as { roomId: string };
      const userId = (request as any).user.userId;

      const messages = await ChatService.getMessages(roomId);
      return reply.send(messages);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
