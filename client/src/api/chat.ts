import { apiClient } from './axios';

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export const getRoomMessages = async (roomId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`/rooms/${roomId}/messages`);
  return response.data;
};
