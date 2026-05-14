import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

@Injectable()
export class CodeGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique, human-readable invite code
   * Format: adjective-noun-4digits (e.g., happy-wolf-9284)
   */
  async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const randomFourDigits = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const code = `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: '-',
        length: 2,
      })}-${randomFourDigits}`;

      // Check if code already exists
      const existing = await this.prisma.roomInvite.findUnique({
        where: { code },
      });
      if (!existing) {
        return code;
      }
    }

    throw new Error('Failed to generate a unique invite code after 10 attempts');
  }
}
