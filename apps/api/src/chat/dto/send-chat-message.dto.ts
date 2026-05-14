import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendChatMessageDto {
  @IsString()
  roomId!: string;

  @IsString()
  content!: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
