import { FastifyInstance } from 'fastify';
import { TestCaseController } from '../controllers/testcase.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function testcaseRoutes(fastify: FastifyInstance) {
  // Routes for a specific file
  fastify.get(
    '/node/:id/testcases',
    { preHandler: [authMiddleware] },
    TestCaseController.getTestCases,
  );
  fastify.post(
    '/node/:id/testcases',
    { preHandler: [authMiddleware] },
    TestCaseController.createTestCase,
  );
  fastify.post(
    '/node/:id/run-tests',
    { preHandler: [authMiddleware] },
    TestCaseController.runTestCases,
  );

  // Routes for a specific test case
  fastify.put(
    '/testcases/:id',
    { preHandler: [authMiddleware] },
    TestCaseController.updateTestCase,
  );
  fastify.delete(
    '/testcases/:id',
    { preHandler: [authMiddleware] },
    TestCaseController.deleteTestCase,
  );
}
