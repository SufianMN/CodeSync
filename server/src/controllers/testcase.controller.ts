import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma';
import { ExecuteService } from '../services/execute.service';

export const TestCaseController = {
  async getTestCases(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const testCases = await prisma.testCase.findMany({
        where: { fileId: id },
        orderBy: { order: 'asc' },
      });
      return reply.send({ success: true, data: testCases });
    } catch (error: any) {
      return reply
        .status(500)
        .send({ error: 'Failed to fetch test cases', details: error.message });
    }
  },

  async createTestCase(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { input, expectedOutput, order } = req.body as any;
      const count = await prisma.testCase.count({ where: { fileId: id } });
      if (count >= 5) {
        return reply.status(400).send({ error: 'Maximum of 5 test cases allowed per file' });
      }
      const testCase = await prisma.testCase.create({
        data: {
          fileId: id,
          input: input || '',
          expectedOutput: expectedOutput || '',
          order: order ?? count,
        },
      });
      return reply.status(201).send({ success: true, data: testCase });
    } catch (error: any) {
      return reply
        .status(500)
        .send({ error: 'Failed to create test case', details: error.message });
    }
  },

  async updateTestCase(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string }; // this is testCaseId
      const { input, expectedOutput, order } = req.body as any;
      const testCase = await prisma.testCase.update({
        where: { id },
        data: {
          ...(input !== undefined && { input }),
          ...(expectedOutput !== undefined && { expectedOutput }),
          ...(order !== undefined && { order }),
        },
      });
      return reply.send({ success: true, data: testCase });
    } catch (error: any) {
      return reply
        .status(500)
        .send({ error: 'Failed to update test case', details: error.message });
    }
  },

  async deleteTestCase(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string }; // this is testCaseId
      await prisma.testCase.delete({ where: { id } });
      return reply.send({ success: true, data: null });
    } catch (error: any) {
      return reply
        .status(500)
        .send({ error: 'Failed to delete test case', details: error.message });
    }
  },

  async runTestCases(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string }; // this is fileId
      const { language, code, timeLimitMs, memoryLimitMB } = req.body as any;

      const testCases = await prisma.testCase.findMany({
        where: { fileId: id },
        orderBy: { order: 'asc' },
      });

      if (testCases.length === 0) {
        return reply.status(400).send({ error: 'No test cases found for this file' });
      }

      const result = await ExecuteService.executeTestCases(
        language,
        code,
        timeLimitMs || 1000,
        memoryLimitMB || 512,
        testCases,
      );

      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to run test cases', details: error.message });
    }
  },
};
