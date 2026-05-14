import { IsString } from 'class-validator';

export class RoomActionDto {
  @IsString()
  roomId!: string;
}
