import { IsString, MinLength } from 'class-validator';

export class JoinRoomViaInviteDto {
  @IsString()
  @MinLength(1)
  inviteCode!: string;
}
