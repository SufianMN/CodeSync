import { apiClient as api } from './axios';

export interface WorkspaceNode {
  id: string;
  roomId: string;
  parentId: string | null;
  type: 'FILE' | 'FOLDER';
  name: string;
  language: string | null;
  content: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export const getWorkspace = async (roomId: string): Promise<WorkspaceNode[]> => {
  const response = await api.get(`/rooms/${roomId}/workspace`);
  return response.data.data; // our Fastify controller returns { success: true, data: nodes }
};

export const createNode = async (
  roomId: string,
  data: { parentId?: string | null; type: 'FILE' | 'FOLDER'; name: string; language?: string },
): Promise<WorkspaceNode> => {
  const response = await api.post(`/rooms/${roomId}/workspace`, data);
  return response.data.data;
};

export const updateNode = async (
  nodeId: string,
  data: { name?: string; parentId?: string | null; content?: string; language?: string },
): Promise<WorkspaceNode> => {
  const response = await api.patch(`/rooms/workspace/node/${nodeId}`, data);
  return response.data.data;
};

export const deleteNode = async (nodeId: string): Promise<void> => {
  await api.delete(`/rooms/workspace/node/${nodeId}`);
};
