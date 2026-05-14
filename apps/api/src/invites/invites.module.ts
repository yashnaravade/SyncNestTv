import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { CodeGeneratorService } from './utils/code-generator';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [InvitesService, CodeGeneratorService],
  controllers: [InvitesController],
})
export class InvitesModule {}
