import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectJellyfinDto } from './dto/connect-jellyfin.dto';

@Injectable()
export class JellyfinService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeServerUrl(value: string) {
    try {
      const url = new URL(value.trim());
      return url.href.replace(/\/+$/, '');
    } catch {
      throw new BadRequestException('Invalid Jellyfin server URL');
    }
  }

  async upsertConfig(userId: string, dto: ConnectJellyfinDto) {
    const serverUrl = this.normalizeServerUrl(dto.serverUrl);

    return this.prisma.jellyfinConfig.upsert({
      where: { userId },
      create: {
        userId,
        serverUrl,
        apiKey: dto.apiKey.trim(),
        jellyfinUserId: dto.jellyfinUserId.trim(),
      },
      update: {
        serverUrl,
        apiKey: dto.apiKey.trim(),
        jellyfinUserId: dto.jellyfinUserId.trim(),
      },
    });
  }

  async getConfig(userId: string) {
    return this.prisma.jellyfinConfig.findUnique({
      where: { userId },
      select: {
        serverUrl: true,
        jellyfinUserId: true,
      },
    });
  }
}
