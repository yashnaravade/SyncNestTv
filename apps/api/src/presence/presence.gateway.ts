import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { PresenceService } from './presence.service';

@WebSocketGateway({ namespace: '/presence', cors: { origin: true, credentials: true } })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PresenceGateway.name);

  constructor(private readonly presenceService: PresenceService) {}

  async handleConnection(socket: Socket) {
    const user = socket.data.user;
    if (!user?.id) {
      this.logger.warn(`Rejecting anonymous socket ${socket.id}`);
      socket.disconnect(true);
      return;
    }

    const count = await this.presenceService.markOnline(user.id);
    this.logger.log(`User ${user.id} connected on /presence (${socket.id}) count=${count}`);

    if (count === 1) {
      socket.broadcast.emit('presence:join', { userId: user.id });
    }

    const online = await this.presenceService.getOnlineUsers();
    socket.emit('presence:update', { users: online });
  }

  async handleDisconnect(socket: Socket) {
    const user = socket.data.user;
    if (!user?.id) {
      return;
    }

    const count = await this.presenceService.markOffline(user.id);
    this.logger.log(`User ${user.id} disconnected from /presence (${socket.id}) count=${count}`);

    if (count === 0) {
      socket.broadcast.emit('presence:leave', { userId: user.id });
    }
  }

  @SubscribeMessage('presence:get')
  async handleGetPresence(@ConnectedSocket() socket: Socket) {
    const online = await this.presenceService.getOnlineUsers();
    socket.emit('presence:update', { users: online });
  }
}
