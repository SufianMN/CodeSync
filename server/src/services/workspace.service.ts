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
    const existing = await prisma.workspaceNode.findFirst({
      where: {
        roomId: data.roomId,
        parentId: data.parentId || null,
        name: data.name,
      },
    });

    if (existing) {
      const error = new Error(
        `A ${existing.type.toLowerCase()} named "${data.name}" already exists in this folder.`,
      );
      (error as any).statusCode = 409;
      throw error;
    }

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
    if (data.name !== undefined || data.parentId !== undefined) {
      const currentNode = await prisma.workspaceNode.findUnique({
        where: { id: nodeId },
      });

      if (currentNode) {
        const newName = data.name ?? currentNode.name;
        const newParentId = data.parentId !== undefined ? data.parentId : currentNode.parentId;

        if (newName !== currentNode.name || newParentId !== currentNode.parentId) {
          const existing = await prisma.workspaceNode.findFirst({
            where: {
              roomId: currentNode.roomId,
              parentId: newParentId,
              name: newName,
              id: { not: nodeId },
            },
          });

          if (existing) {
            const error = new Error(
              `A ${existing.type.toLowerCase()} named "${newName}" already exists in this folder.`,
            );
            (error as any).statusCode = 409;
            throw error;
          }
        }
      }
    }

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
