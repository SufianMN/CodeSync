import { prisma } from '../utils/prisma';

export class WorkspaceService {
  static async getWorkspace(roomId: string) {
    return prisma.workspaceNode.findMany({
      where: { roomId },
      orderBy: [{ type: 'desc' }, { name: 'asc' }],
    });
  }

  static async createNode(data: {
    roomId: string;
    parentId?: string | null;
    type: 'FILE' | 'FOLDER';
    name: string;
    language?: string;
  }) {
    return prisma.workspaceNode.create({
      data: {
        roomId: data.roomId,
        parentId: data.parentId || null,
        type: data.type,
        name: data.name,
        language: data.language || null,
        content: data.type === 'FILE' ? '' : null,
      },
    });
  }

  static async updateNode(
    nodeId: string,
    data: {
      name?: string;
      parentId?: string | null;
      content?: string;
      language?: string;
    },
  ) {
    return prisma.workspaceNode.update({
      where: { id: nodeId },
      data,
    });
  }

  static async deleteNode(nodeId: string) {
    // Cascade delete is handled by Prisma schema for children
    return prisma.workspaceNode.delete({
      where: { id: nodeId },
    });
  }
}
