import {
  Injectable,
  ForbiddenException,
  HttpException,
  HttpStatus,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { Prisma, MessageType } from '@prisma/client';

@Injectable()
export class ChatService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly rateLimitWindowSeconds = 5;
  private readonly maxMessagesPerWindow = 5;

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async saveMessage(
    userId: string,
    roomId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    metadata?: Prisma.InputJsonValue
  ): Promise<
    Prisma.MessageGetPayload<{
      include: { user: { select: { id: true; username: true; email: true } } };
    }>
  > {
    await this.ensureRoomMembership(userId, roomId);
    await this.enforceRateLimit(userId);

    return this.prisma.message.create({
      data: {
        roomId,
        userId,
        content,
        type,
        metadata: metadata as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async getRoomHistory(roomId: string, limit = 50) {
    const messages = await this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
    return messages.reverse();
  }

  async ensureRoomMembership(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (!member) {
      throw new ForbiddenException('User is not a member of this room');
    }
  }

  private async enforceRateLimit(userId: string) {
    const key = `chat:rate_limit:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.rateLimitWindowSeconds);
    }
    if (count > this.maxMessagesPerWindow) {
      throw new HttpException('Chat rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
