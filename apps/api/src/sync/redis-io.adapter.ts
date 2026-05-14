import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { Server, ServerOptions, Socket } from 'socket.io';
import { SocketAuthService } from './socket-auth.service';

export class RedisIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly authService: SocketAuthService
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: true,
        credentials: true,
        ...(options?.cors || {}),
      },
    });

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();

    pubClient.on('error', (error: unknown) => {
      console.error('Redis pub client error:', error);
    });

    subClient.on('error', (error: unknown) => {
      console.error('Redis sub client error:', error);
    });

    server.adapter(createAdapter(pubClient, subClient));

    server.use(async (socket: Socket, next: (err?: any) => void) => {
      try {
        const token = this.getSocketToken(socket);
        const user = await this.authService.validateToken(token || '');
        socket.data.user = user;
        next();
      } catch (error) {
        next(error instanceof Error ? error : new Error('Unauthorized'));
      }
    });

    return server;
  }

  private getSocketToken(socket: Socket): string | undefined {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const authHeader = socket.handshake.headers?.authorization as string | undefined;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        return parts[1].trim();
      }
    }

    const queryToken = socket.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return queryToken.trim();
    }

    return undefined;
  }
}
