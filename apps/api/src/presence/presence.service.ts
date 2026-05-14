import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly key = 'presence:online_users';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async markOnline(userId: string): Promise<number> {
    const count = await this.redis.hincrby(this.key, userId, 1);
    return count;
  }

  async markOffline(userId: string): Promise<number> {
    const count = await this.redis.hincrby(this.key, userId, -1);
    if (count <= 0) {
      await this.redis.hdel(this.key, userId);
      return 0;
    }
    return count;
  }

  async getOnlineUsers(): Promise<string[]> {
    const raw = await this.redis.hgetall(this.key);
    return Object.keys(raw);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
