import { prisma } from '../utils/prisma';
import { CreateRoomInput, UpdateRoomInput } from '../schemas/room.schema';

export class RoomService {
  static async createRoom(ownerId: string, data: CreateRoomInput) {
    const filename = `main.${this.getExtension(data.language)}`;

    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          name: data.name,
          ownerId,
        },
      });

      await tx.roomFile.create({
        data: {
          roomId: newRoom.id,
          filename,
          language: data.language,
          content: '',
        },
      });

      await tx.roomMember.create({
        data: {
          roomId: newRoom.id,
          userId: ownerId,
        },
      });

      return newRoom;
    });

    return {
      id: room.id,
      name: room.name,
      language: data.language,
    };
  }

  static async getUserRooms(userId: string) {
    const rooms = await prisma.room.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { files: { take: 1 } },
    });

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      language: room.files[0]?.language || 'cpp',
      createdAt: room.createdAt,
    }));
  }

  static async getRoomById(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { files: { take: 1 } },
    });

    if (!room) {
      throw Object.assign(new Error('Room not found'), { statusCode: 404 });
    }

    if (room.ownerId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const primaryFile = room.files[0];

    return {
      id: room.id,
      name: room.name,
      language: primaryFile?.language || 'cpp',
      code: primaryFile?.content || '',
      createdAt: room.createdAt,
    };
  }

  static async updateRoom(roomId: string, userId: string, data: UpdateRoomInput) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw Object.assign(new Error('Room not found'), { statusCode: 404 });
    }

    if (room.ownerId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { name: data.name },
    });

    return {
      id: updatedRoom.id,
      name: updatedRoom.name,
      createdAt: updatedRoom.createdAt,
    };
  }

  static async deleteRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw Object.assign(new Error('Room not found'), { statusCode: 404 });
    }

    if (room.ownerId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });
  }

  private static getExtension(language: string): string {
    const extMap: Record<string, string> = {
      cpp: 'cpp',
      java: 'java',
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      go: 'go',
      rust: 'rs',
    };
    return extMap[language.toLowerCase()] || 'txt';
  }
}
