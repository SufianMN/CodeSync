import { prisma } from '../utils/prisma';
import { SendChatMessageInput } from '../schemas/chat.schema';

export class ChatService {
  static async sendMessage(roomId: string, userId: string, data: SendChatMessageInput) {
    // Validate room and user membership
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('User is not a member of this room');
    }

    const message = await prisma.message.create({
      data: {
        roomId,
        userId,
        content: data.content,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      username: message.user.name,
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  static async getMessages(roomId: string) {
    const messages = await prisma.message.findMany({
      where: {
        roomId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 200, // Reasonable limit for chat history
    });

    return messages.map((message) => ({
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      username: message.user.name,
      content: message.content,
      createdAt: message.createdAt,
    }));
  }
}
