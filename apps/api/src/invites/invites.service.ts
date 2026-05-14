import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoomRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from './utils/code-generator';
import { CreateInviteDto } from './dto/create-invite.dto';

const membersWithUser = {
  include: {
    user: {
      select: { id: true, email: true, username: true },
    },
  },
} satisfies Prisma.RoomMemberArgs;

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: CodeGeneratorService
  ) {}

  /**
   * Create a new invite code for a room
   */
  async createInvite(roomId: string, userId: string, dto: CreateInviteDto) {
    // Verify room exists and user is a member (owner/co-host)
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if user is owner or co-host
    const membership = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    if (
      !membership ||
      (membership.role !== RoomRole.OWNER && membership.role !== RoomRole.CO_HOST)
    ) {
      throw new ForbiddenException('Only room owners and co-hosts can create invites');
    }

    // Generate unique code
    const code = await this.codeGenerator.generateUniqueCode();

    // Calculate expiry date if provided
    const expiresAt = dto.expiryDays
      ? new Date(Date.now() + dto.expiryDays * 24 * 60 * 60 * 1000)
      : null;

    // Create the invite
    const invite = await this.prisma.roomInvite.create({
      data: {
        code,
        roomId,
        createdBy: userId,
        maxUses: dto.maxUses || null,
        expiresAt,
      },
    });

    return {
      id: invite.id,
      code: invite.code,
      roomId: invite.roomId,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      useCount: invite.useCount,
      createdAt: invite.createdAt,
    };
  }

  /**
   * Validate an invite code and join the user to the room
   */
  async validateAndUseInvite(inviteCode: string, userId: string) {
    // Find the invite
    const invite = await this.prisma.roomInvite.findUnique({
      where: { code: inviteCode },
      include: {
        room: {
          include: {
            members: membersWithUser,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if invite has expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new BadRequestException('This invite code has expired');
    }

    // Check if invite has reached max uses
    if (invite.maxUses && invite.useCount >= invite.maxUses) {
      throw new BadRequestException('This invite code has reached its maximum uses');
    }

    // Check if user is already in the room
    const existingMembership = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId: invite.roomId } },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a member of this room');
    }

    // Add user to room as VIEWER
    const newMembership = await this.prisma.roomMember.create({
      data: {
        userId,
        roomId: invite.roomId,
        role: RoomRole.VIEWER,
      },
      include: {
        user: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    // Increment the invite use count
    await this.prisma.roomInvite.update({
      where: { id: invite.id },
      data: { useCount: invite.useCount + 1 },
    });

    return {
      room: invite.room,
      member: newMembership,
      message: 'Successfully joined room via invite',
    };
  }

  /**
   * Get all invites for a room (owner/co-host only)
   */
  async getInvitesForRoom(roomId: string, userId: string) {
    // Verify user is owner or co-host
    const membership = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    if (
      !membership ||
      (membership.role !== RoomRole.OWNER && membership.role !== RoomRole.CO_HOST)
    ) {
      throw new ForbiddenException('Only room owners and co-hosts can view invites');
    }

    const invites = await this.prisma.roomInvite.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    });

    return invites;
  }

  /**
   * Revoke/delete an invite
   */
  async revokeInvite(inviteId: string, userId: string) {
    // Find the invite
    const invite = await this.prisma.roomInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    // Verify user is owner or co-host of the room
    const membership = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId: invite.roomId } },
    });

    if (
      !membership ||
      (membership.role !== RoomRole.OWNER && membership.role !== RoomRole.CO_HOST)
    ) {
      throw new ForbiddenException('Only room owners and co-hosts can revoke invites');
    }

    // Delete the invite
    await this.prisma.roomInvite.delete({
      where: { id: inviteId },
    });

    return { message: 'Invite revoked successfully' };
  }
}
