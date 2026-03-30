import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { createHash } from 'crypto';

type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

@Injectable()
export class RefreshTokenService {
  constructor(private prisma: PrismaService) {}

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async store(userId: string, token: string, expiresAt: Date) {
    const tokenHash = this.hash(token);
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async fetchValid(token: string, userId: string) {
    const tokenHash = this.hash(token);
    const now = new Date();
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        tokenHash,
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return refreshToken ?? null;
  }

  async revokeById(id: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { id },
    });
  }

  async revokeByUserId(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
