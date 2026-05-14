import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/sync', cors: { origin: true, credentials: true } })
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SyncGateway.name);

  handleConnection(socket: Socket) {
    const user = socket.data.user;
    this.logger.log(`Socket /sync connected: ${socket.id} user=${user?.id ?? 'unknown'}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket /sync disconnected: ${socket.id}`);
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: { status: 'ok' } };
  }
}
