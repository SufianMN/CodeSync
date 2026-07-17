import { apiClient } from './axios';

export interface ExecuteRequest {
  language: string;
  code: string;
  stdin?: string;
}

export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtime: number;
  memory: number;
  success: boolean;
}

export const executeCode = async (data: ExecuteRequest): Promise<ExecuteResponse> => {
  const response = await apiClient.post('/execute', data);
  return response.data;
};
