import { IsString, Length, IsUrl } from 'class-validator';

export class ConnectJellyfinDto {
  @IsUrl({}, { message: 'Enter a valid Jellyfin server URL' })
  serverUrl!: string;

  @IsString()
  @Length(16, 512, { message: 'API key must be at least 16 characters' })
  apiKey!: string;

  @IsString()
  @Length(1, 128, { message: 'Jellyfin user ID is required' })
  jellyfinUserId!: string;
}
