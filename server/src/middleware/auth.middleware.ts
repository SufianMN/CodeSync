import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies.token;

  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized: Missing cookie' });
  }

  try {
    const payload = verifyToken(token);
    // Attach user payload to request
    (request as any).user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
}
