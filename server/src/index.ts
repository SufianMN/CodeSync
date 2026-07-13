import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
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
      origin: true, // Allow all origins for MVP
    });

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
    });

    server.get('/api/health', async (request, reply) => {
      return { success: true, data: { status: 'ok', timestamp: new Date() } };
    });

    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
