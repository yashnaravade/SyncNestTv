import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JoinRoomViaInviteDto } from './dto/join-room-via-invite.dto';
import { InvitesService } from './invites.service';

type Authed = Request & {
  user: { id: string; email: string; username: string; createdAt: Date; updatedAt: Date };
};

@Controller('invites')
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  /**
   * POST /invites/join
   * Join a room using an invite code
   */
  @Post('join')
  joinRoom(@Req() req: Authed, @Body() dto: JoinRoomViaInviteDto) {
    return this.invites.validateAndUseInvite(dto.inviteCode, req.user.id);
  }

  /**
   * POST /invites/join/with-code
   * Join a room using an invite code (legacy alias)
   */
  @Post('join/with-code')
  joinRoomViaInvite(@Req() req: Authed, @Body() dto: JoinRoomViaInviteDto) {
    return this.invites.validateAndUseInvite(dto.inviteCode, req.user.id);
  }

  /**
   * POST /invites/:roomId
   * Create a new invite code for a room (owner/co-host only)
   */
  @Post(':roomId')
  createInvite(@Req() req: Authed, @Param('roomId') roomId: string, @Body() dto: CreateInviteDto) {
    return this.invites.createInvite(roomId, req.user.id, dto);
  }

  /**
   * GET /invites/:roomId
   * Get all invites for a room (owner/co-host only)
   */
  @Get(':roomId')
  getInvites(@Req() req: Authed, @Param('roomId') roomId: string) {
    return this.invites.getInvitesForRoom(roomId, req.user.id);
  }

  /**
   * DELETE /invites/:inviteId
   * Revoke/delete an invite
   */
  @Delete(':inviteId')
  revokeInvite(@Req() req: Authed, @Param('inviteId') inviteId: string) {
    return this.invites.revokeInvite(inviteId, req.user.id);
  }
}
