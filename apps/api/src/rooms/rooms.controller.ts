import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddRoomMemberDto } from './dto/add-room-member.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

type Authed = Request & {
  user: { id: string; email: string; username: string; createdAt: Date; updatedAt: Date };
};

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post()
  create(@Req() req: Authed, @Body() dto: CreateRoomDto) {
    return this.rooms.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: Authed) {
    return this.rooms.listForUser(req.user.id);
  }

  @Get(':id')
  getOne(@Req() req: Authed, @Param('id') id: string) {
    return this.rooms.findOneForUser(id, req.user.id);
  }

  @Patch(':id')
  update(@Req() req: Authed, @Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.rooms.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Authed, @Param('id') id: string) {
    return this.rooms.deactivate(id, req.user.id);
  }

  @Post(':id/members')
  addMember(@Req() req: Authed, @Param('id') id: string, @Body() dto: AddRoomMemberDto) {
    return this.rooms.addMember(id, req.user.id, dto);
  }
}
