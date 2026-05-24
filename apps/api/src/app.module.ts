import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { InvitesModule } from './invites/invites.module';
import { SyncModule } from './sync/sync.module';
import { PresenceModule } from './presence/presence.module';
import { ChatModule } from './chat/chat.module';
import { JellyfinModule } from './jellyfin/jellyfin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RoomsModule,
    InvitesModule,
    SyncModule,
    PresenceModule,
    ChatModule,
    JellyfinModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
