import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import cookie from '@fastify/cookie';
import { prisma } from './utils/prisma';
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import { initializeSocket } from './socket/socket';

const server = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
});

const start = async () => {
  try {
    await server.register(cors, {
      origin: 'http://localhost:5173', // Vite default port
      credentials: true, // Important for cookies
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await server.register(cookie);

    await server.register(swagger, {
      openapi: {
        info: {
          title: 'CodeSync API',
          description: 'API documentation for CodeSync',
          version: '1.0.0',
        },
        servers: [{ url: 'http://localhost:3000' }],
      },
    });

    await server.register(scalar, {
      routePrefix: '/docs',
      configuration: {
        spec: {
          content: () => server.swagger(),
        },
      },
    });

    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(roomRoutes, { prefix: '/api/rooms' });

    server.get('/api/health', async (request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          success: true,
          data: { status: 'ok', database: 'connected', timestamp: new Date() },
        };
      } catch (dbError) {
        server.log.error(dbError);
        return reply
          .status(503)
          .send({ success: false, error: { message: 'Database disconnected', issues: [] } });
      }
    });

    // Initialize Socket.IO attached to Fastify's raw HTTP server
    await server.ready();
    initializeSocket(server);

    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
