import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, googleLoginSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';

export class AuthController {
  static async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerSchema.parse(request.body);
      const result = await AuthService.register(data);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: error.issues });
      }
      if (error.message === 'Email already in use') {
        return reply.status(409).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = loginSchema.parse(request.body);
      const { token, user } = await AuthService.login(data);

      const isProduction = process.env.NODE_ENV === 'production';

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return reply.send({ user });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: error.issues });
      }
      if (error.message === 'Invalid email or password') {
        return reply.status(401).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async googleLogin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = googleLoginSchema.parse(request.body);
      const { token, user } = await AuthService.googleLogin(data.token);

      const isProduction = process.env.NODE_ENV === 'production';

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return reply.send({ user });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: error.issues });
      }
      if (error.message === 'Invalid Google token') {
        return reply.status(401).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.userId;
      const user = await AuthService.getUserById(userId);
      return reply.send(user);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('token', { path: '/' });
    return reply.send({ message: 'Logged out successfully' });
  }
}
