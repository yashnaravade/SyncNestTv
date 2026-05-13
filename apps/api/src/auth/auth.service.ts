import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_COOKIE } from './constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '1h';
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);
const BCRYPT_ROUNDS = 10;

function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

function newRefreshTokenValue(): string {
  return randomBytes(32).toString('hex');
}

export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private signAccess(userId: string, email: string) {
    return this.jwt.sign(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
        expiresIn: ACCESS_EXPIRES,
      },
    );
  }

  async register(dto: RegisterDto, res: Response) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          username: dto.username.trim(),
          password: passwordHash,
        },
        select: { id: true, email: true, username: true, createdAt: true, updatedAt: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Email or username already in use');
      }
      throw e;
    }

    await this.issueRefreshSession(user.id, res);
    const accessToken = this.signAccess(user.id, user.email);
    return { user: this.serializeUser(user), accessToken };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.issueRefreshSession(user.id, res);
    const accessToken = this.signAccess(user.id, user.email);
    return {
      user: this.serializeUser({
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
      accessToken,
    };
  }

  async refresh(rawRefresh: string | undefined, res: Response) {
    if (!rawRefresh) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const tokenHash = hashRefreshToken(rawRefresh);
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    await this.issueRefreshSession(record.userId, res);
    const accessToken = this.signAccess(record.user.id, record.user.email);
    return { accessToken };
  }

  async logout(userId: string, rawRefresh: string | undefined, res: Response) {
    if (rawRefresh) {
      const tokenHash = hashRefreshToken(rawRefresh);
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(REFRESH_COOKIE, {
      path: '/api/auth',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return { ok: true };
  }

  private async issueRefreshSession(userId: string, res: Response) {
    const raw = newRefreshTokenValue();
    const tokenHash = hashRefreshToken(raw);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: tokenHash,
        expiresAt,
      },
    });

    res.cookie(REFRESH_COOKIE, raw, refreshCookieOptions());
  }

  private serializeUser(user: {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
