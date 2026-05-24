import {
  Injectable,
  BadRequestException,
  BadGatewayException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectJellyfinDto } from './dto/connect-jellyfin.dto';
import { JellyfinCryptoService } from './jellyfin-crypto.service';

@Injectable()
export class JellyfinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: JellyfinCryptoService
  ) {}

  private normalizeServerUrl(value: string) {
    try {
      const url = new URL(value.trim());
      return url.href.replace(/\/+$/, '');
    } catch {
      throw new BadRequestException('Invalid Jellyfin server URL');
    }
  }

  private buildJellyfinRequestUrl(
    serverUrl: string,
    path: string,
    query: Record<string, string | string[]> = {}
  ) {
    const normalizedUrl = this.normalizeServerUrl(serverUrl);
    const url = new URL(`${normalizedUrl}${path}`);
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => params.append(key, entry));
      } else if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    }

    if (path === '/Items') {
      if (!params.has('Recursive')) {
        params.set('Recursive', 'true');
      }
      if (!params.has('IncludeItemTypes')) {
        params.set('IncludeItemTypes', 'Movie,Series,Episode');
      }
      if (!params.has('Limit')) {
        params.set('Limit', '50');
      }
    }

    url.search = params.toString();
    return url.toString();
  }

  private buildHeaders(apiKey: string) {
    return {
      'X-Emby-Token': apiKey,
      Accept: 'application/json',
    };
  }

  private async fetchJellyfinJson(url: string, headers: Record<string, string>) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new BadGatewayException(
          `Jellyfin request failed with status ${response.status}`
        );
      }
      return response.json();
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException('Failed to communicate with Jellyfin server');
    }
  }

  async upsertConfig(userId: string, dto: ConnectJellyfinDto) {
    const serverUrl = this.normalizeServerUrl(dto.serverUrl);
    const encryptedApiKey = this.crypto.encrypt(dto.apiKey.trim());

    return this.prisma.jellyfinConfig.upsert({
      where: { userId },
      create: {
        userId,
        serverUrl,
        encryptedApiKey,
        jellyfinUserId: dto.jellyfinUserId.trim(),
      },
      update: {
        serverUrl,
        encryptedApiKey,
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

  async getDecryptedConfig(userId: string) {
    const config = await this.prisma.jellyfinConfig.findUnique({
      where: { userId },
    });
    if (!config) {
      return null;
    }

    if (config.encryptedApiKey) {
      return {
        serverUrl: config.serverUrl,
        jellyfinUserId: config.jellyfinUserId,
        apiKey: this.crypto.decrypt(config.encryptedApiKey),
      };
    }

    if (config.apiKey) {
      const encryptedApiKey = this.crypto.encrypt(config.apiKey);
      await this.prisma.jellyfinConfig.update({
        where: { userId },
        data: {
          encryptedApiKey,
          apiKey: null,
        },
      });

      return {
        serverUrl: config.serverUrl,
        jellyfinUserId: config.jellyfinUserId,
        apiKey: config.apiKey,
      };
    }

    return null;
  }

  async proxyLibrary(userId: string, query: Record<string, string | string[]> = {}) {
    const config = await this.getDecryptedConfig(userId);
    if (!config) {
      throw new NotFoundException('Jellyfin configuration not found');
    }

    const url = this.buildJellyfinRequestUrl(config.serverUrl, '/Items', query);
    return this.fetchJellyfinJson(url, this.buildHeaders(config.apiKey));
  }

  async proxyItem(
    userId: string,
    itemId: string,
    query: Record<string, string | string[]> = {}
  ) {
    const config = await this.getDecryptedConfig(userId);
    if (!config) {
      throw new NotFoundException('Jellyfin configuration not found');
    }

    const url = this.buildJellyfinRequestUrl(
      config.serverUrl,
      `/Items/${itemId}`,
      query
    );
    return this.fetchJellyfinJson(url, this.buildHeaders(config.apiKey));
  }
}
