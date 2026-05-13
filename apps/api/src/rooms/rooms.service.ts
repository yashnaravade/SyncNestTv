import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoomRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AddRoomMemberDto } from './dto/add-room-member.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

const membersWithUser = {
  include: {
    user: {
      select: { id: true, email: true, username: true },
    },
  },
} satisfies Prisma.RoomMemberArgs;

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueRoomCode(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = `r-${randomBytes(6).toString('base64url')}`;
      const exists = await this.prisma.room.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new BadRequestException('Could not allocate a unique room code');
  }

  async create(userId: string, dto: CreateRoomDto) {
    const code = await this.uniqueRoomCode();
    const room = await this.prisma.room.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        code,
        members: {
          create: { userId, role: RoomRole.OWNER },
        },
      },
      include: {
        members: membersWithUser,
      },
    });
    return room;
  }

  async listForUser(userId: string) {
    return this.prisma.room.findMany({
      where: {
        isActive: true,
        members: { some: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        members: {
          where: { userId },
          take: 1,
        },
      },
    });
  }

  async findOneForUser(roomId: string, userId: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        members: { some: { userId } },
      },
      include: {
        members: membersWithUser,
      },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async update(roomId: string, actorId: string, dto: UpdateRoomDto) {
    await this.requireRole(roomId, actorId, [RoomRole.OWNER, RoomRole.CO_HOST]);

    const data: Prisma.RoomUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim();
    if (dto.isActive !== undefined) {
      await this.requireRole(roomId, actorId, [RoomRole.OWNER]);
      data.isActive = dto.isActive;
    }

    if (Object.keys(data).length === 0) {
      return this.findOneForUser(roomId, actorId);
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data,
      include: { members: membersWithUser },
    });
  }

  async deactivate(roomId: string, actorId: string) {
    await this.requireRole(roomId, actorId, [RoomRole.OWNER]);
    return this.prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });
  }

  async addMember(roomId: string, actorId: string, dto: AddRoomMemberDto) {
    if (dto.userId === actorId) {
      throw new BadRequestException('Use a different user to add as member');
    }

    const actorRole = await this.getMemberRole(roomId, actorId);
    if (!actorRole) {
      throw new ForbiddenException();
    }

    if (dto.role === RoomRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER via this endpoint');
    }

    if (dto.role === RoomRole.CO_HOST && actorRole !== RoomRole.OWNER) {
      throw new ForbiddenException('Only the room owner can assign co-hosts');
    }

    if (actorRole === RoomRole.VIEWER) {
      throw new ForbiddenException();
    }

    const target = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    try {
      return await this.prisma.roomMember.create({
        data: {
          roomId,
          userId: dto.userId,
          role: dto.role,
        },
        ...membersWithUser,
      });
    } catch {
      throw new BadRequestException('User is already a member of this room');
    }
  }

  private async getMemberRole(roomId: string, userId: string): Promise<RoomRole | null> {
    const m = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    return m?.role ?? null;
  }

  private async requireRole(roomId: string, userId: string, allowed: RoomRole[]) {
    const role = await this.getMemberRole(roomId, userId);
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException('Insufficient room permissions');
    }
  }
}
