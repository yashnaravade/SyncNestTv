import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { Prisma } from '@prisma/client';
import { ChatService } from './chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { RoomActionDto } from './dto/room-action.dto';

@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(socket: Socket) {
    const user = socket.data.user;
    this.logger.log(`Chat connected: ${socket.id} user=${user?.id ?? 'anonymous'}`);
  }

  handleDisconnect(socket: Socket) {
    const user = socket.data.user;
    this.logger.log(`Chat disconnected: ${socket.id} user=${user?.id ?? 'anonymous'}`);
  }

  @SubscribeMessage('chat:join')
  async handleJoin(@ConnectedSocket() socket: Socket, @MessageBody() payload: RoomActionDto) {
    socket.join(payload.roomId);
    socket.emit('chat:joined', { roomId: payload.roomId });
    socket.to(payload.roomId).emit('chat:user:joined', {
      userId: socket.data.user?.id,
      username: socket.data.user?.username,
      roomId: payload.roomId,
    });
  }

  @SubscribeMessage('chat:leave')
  async handleLeave(@ConnectedSocket() socket: Socket, @MessageBody() payload: RoomActionDto) {
    socket.leave(payload.roomId);
    socket.emit('chat:left', { roomId: payload.roomId });
    socket.to(payload.roomId).emit('chat:user:left', {
      userId: socket.data.user?.id,
      username: socket.data.user?.username,
      roomId: payload.roomId,
    });
  }

  @SubscribeMessage('chat:message')
  async handleMessage(@ConnectedSocket() socket: Socket, @MessageBody() dto: SendChatMessageDto) {
    const user = socket.data.user;
    const message = await this.chatService.saveMessage(
      user.id,
      dto.roomId,
      dto.content,
      dto.type,
      dto.metadata as Prisma.InputJsonValue,
    );

    const payload = {
      id: message.id,
      roomId: message.roomId,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      user: {
        id: message.user.id,
        username: message.user.username,
      },
    };

    socket.to(dto.roomId).emit('chat:message', payload);
    socket.emit('chat:message', payload);
    return payload;
  }

  @SubscribeMessage('chat:typing:start')
  handleTypingStart(@ConnectedSocket() socket: Socket, @MessageBody() payload: RoomActionDto) {
    const user = socket.data.user;
    socket.to(payload.roomId).emit('chat:typing:start', {
      userId: user?.id,
      username: user?.username,
      roomId: payload.roomId,
    });
  }

  @SubscribeMessage('chat:typing:stop')
  handleTypingStop(@ConnectedSocket() socket: Socket, @MessageBody() payload: RoomActionDto) {
    const user = socket.data.user;
    socket.to(payload.roomId).emit('chat:typing:stop', {
      userId: user?.id,
      username: user?.username,
      roomId: payload.roomId,
    });
  }

  @SubscribeMessage('chat:history')
  async handleHistory(@ConnectedSocket() socket: Socket, @MessageBody() payload: RoomActionDto) {
    const history = await this.chatService.getRoomHistory(payload.roomId);
    socket.emit('chat:history', { roomId: payload.roomId, messages: history });
  }
}
