import { FastifyRequest, FastifyReply } from 'fastify';
import { RoomService } from '../services/room.service';
import { createRoomSchema, updateRoomSchema } from '../schemas/room.schema';
import { ZodError } from 'zod';

export class RoomController {
  static async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createRoomSchema.parse(request.body);
      const userId = (request as any).user.userId;
      const result = await RoomService.createRoom(userId, data);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.userId;
      const rooms = await RoomService.getUserRooms(userId);
      return reply.send(rooms);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.userId;
      const roomId = request.params.id;
      const room = await RoomService.getRoomById(roomId, userId);
      return reply.send(room);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = updateRoomSchema.parse(request.body);
      const userId = (request as any).user.userId;
      const roomId = request.params.id;
      const room = await RoomService.updateRoom(roomId, userId, data);
      return reply.send(room);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: error.issues });
      }
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.userId;
      const roomId = request.params.id;
      await RoomService.deleteRoom(roomId, userId);
      return reply.send({ message: 'Room deleted successfully' });
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
