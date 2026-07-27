import { apiClient as api } from './axios';

export interface TestCase {
  id: string;
  fileId: string;
  input: string;
  expectedOutput: string;
  order: number;
}

export const getTestCases = async (fileId: string): Promise<TestCase[]> => {
  const response = await api.get(`/workspace/node/${fileId}/testcases`);
  return response.data.data;
};

export const createTestCase = async (
  fileId: string,
  data: Partial<TestCase>,
): Promise<TestCase> => {
  const response = await api.post(`/workspace/node/${fileId}/testcases`, data);
  return response.data.data;
};

export const updateTestCase = async (
  testCaseId: string,
  data: Partial<TestCase>,
): Promise<TestCase> => {
  const response = await api.put(`/workspace/testcases/${testCaseId}`, data);
  return response.data.data;
};

export const deleteTestCase = async (testCaseId: string): Promise<void> => {
  await api.delete(`/workspace/testcases/${testCaseId}`);
};

export interface TestCaseResult {
  id: string;
  status:
    | 'Correct'
    | 'Wrong Answer'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Runtime Error'
    | 'Compilation Error';
  runtimeMs?: number;
  memoryMB?: number;
  expected?: string;
  received?: string;
  stderr?: string;
}

export interface RunTestsResponse {
  passed: number;
  total: number;
  results: TestCaseResult[];
}

export const runTestCases = async (
  fileId: string,
  data: { language: string; code: string; timeLimitMs: number; memoryLimitMB: number },
): Promise<RunTestsResponse> => {
  const response = await api.post(`/workspace/node/${fileId}/run-tests`, data);
  return response.data.data;
};
