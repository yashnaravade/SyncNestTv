import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SocketAuthService } from './socket-auth.service';
import { SyncGateway } from './sync.gateway';

@Module({
  imports: [AuthModule],
  providers: [SocketAuthService, SyncGateway],
})
export class SyncModule {}
