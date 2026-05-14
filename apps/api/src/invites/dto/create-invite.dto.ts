import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateInviteDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  expiryDays?: number; // Number of days the invite is valid

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number; // Maximum number of times this invite can be used
}
