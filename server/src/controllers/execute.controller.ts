import { FastifyRequest, FastifyReply } from 'fastify';
import { executeSchema } from '../schemas/execute.schema';
import { ExecuteService } from '../services/execute.service';

export const ExecuteController = {
  async executeCode(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsedBody = executeSchema.safeParse(req.body);

      if (!parsedBody.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid request',
          details: parsedBody.error,
        });
      }

      const { language, code, stdin } = parsedBody.data;

      const result = await ExecuteService.executeCode(language, code, stdin);

      return reply.send(result);
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Execution service failed',
        details: error.message,
      });
    }
  },
};
