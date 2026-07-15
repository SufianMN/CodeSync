import { apiClient } from './axios';

export interface Room {
  id: string;
  name: string;
  language: string;
  code?: string;
  createdAt: string;
}

export const createRoom = async (name: string, language: string): Promise<Room> => {
  const response = await apiClient.post('/rooms', { name, language });
  return response.data;
};

export const getRooms = async (): Promise<Room[]> => {
  const response = await apiClient.get('/rooms');
  return response.data;
};

export const getRoomById = async (id: string): Promise<Room> => {
  const response = await apiClient.get(`/rooms/${id}`);
  return response.data;
};

export const updateRoom = async (id: string, name: string): Promise<Room> => {
  const response = await apiClient.patch(`/rooms/${id}`, { name });
  return response.data;
};

export const deleteRoom = async (id: string): Promise<void> => {
  await apiClient.delete(`/rooms/${id}`);
};

export interface RoomCode {
  language: string;
  code: string;
}

export const getRoomCode = async (id: string): Promise<RoomCode> => {
  const response = await apiClient.get(`/rooms/${id}/code`);
  return response.data;
};

export const updateRoomCode = async (id: string, code: string, language: string): Promise<void> => {
  await apiClient.put(`/rooms/${id}/code`, { code, language });
};
