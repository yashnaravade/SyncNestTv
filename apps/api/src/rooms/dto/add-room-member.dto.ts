import { IsEnum, IsString } from 'class-validator';
import { RoomRole } from '@prisma/client';

export class AddRoomMemberDto {
  @IsString()
  userId!: string;

  @IsEnum(RoomRole)
  role!: RoomRole;
}
