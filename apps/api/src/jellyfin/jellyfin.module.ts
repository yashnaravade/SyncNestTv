import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JellyfinController } from './jellyfin.controller';
import { JellyfinService } from './jellyfin.service';
import { JellyfinCryptoService } from './jellyfin-crypto.service';
import { MediaController } from './media.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [JellyfinController, MediaController],
  providers: [JellyfinService, JellyfinCryptoService],
})
export class JellyfinModule {}
