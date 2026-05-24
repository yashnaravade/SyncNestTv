import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JellyfinService } from './jellyfin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly jellyfinService: JellyfinService) {}

  @Get('library')
  async getLibrary(
    @Req()
    req: Request & {
      user: { id: string };
    },
    @Query() query: Record<string, string | string[]>
  ) {
    return this.jellyfinService.proxyLibrary(req.user.id, query);
  }

  @Get(':id')
  async getMediaItem(
    @Req()
    req: Request & {
      user: { id: string };
    },
    @Param('id') id: string,
    @Query() query: Record<string, string | string[]>
  ) {
    return this.jellyfinService.proxyItem(req.user.id, id, query);
  }
}
