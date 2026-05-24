import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JellyfinController } from './jellyfin.controller';
import { JellyfinService } from './jellyfin.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [JellyfinController],
  providers: [JellyfinService],
})
export class JellyfinModule {}
