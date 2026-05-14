import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface SocketAuthUser {
  id: string;
  email: string;
  username: string;
}

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async validateToken(token: string): Promise<SocketAuthUser> {
    if (!token?.trim()) {
      throw new UnauthorizedException('Socket auth token is required');
    }

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify<{ sub: string; email: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired socket auth token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      throw new UnauthorizedException('Socket auth user not found');
    }

    return user;
  }
}
