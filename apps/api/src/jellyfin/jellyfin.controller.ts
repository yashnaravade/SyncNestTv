import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectJellyfinDto } from './dto/connect-jellyfin.dto';
import { JellyfinService } from './jellyfin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('jellyfin')
@UseGuards(JwtAuthGuard)
export class JellyfinController {
  constructor(private readonly jellyfinService: JellyfinService) {}

  @Get('config')
  async getConfig(
    @Req()
    req: Request & {
      user: { id: string };
    }
  ) {
    return { config: await this.jellyfinService.getConfig(req.user.id) };
  }

  @Post('connect')
  async connect(
    @Req()
    req: Request & {
      user: { id: string };
    },
    @Body() dto: ConnectJellyfinDto
  ) {
    await this.jellyfinService.upsertConfig(req.user.id, dto);
    return { ok: true, message: 'Jellyfin configuration saved successfully' };
  }
}
