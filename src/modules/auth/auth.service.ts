import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/common/services/prisma.service';
import { SmsService } from '@/modules/sms/sms.service';
import { RefreshTokenService } from '@/common/services/refresh-token.service';
import { getLogger } from '@/common/utils/logger';
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@/core/exceptions/custom.exceptions';
import { ErrorCode } from '@/common/constants/error-codes';
import {
  SendOtpDto,
  VerifyOtpDto,
  AdminLoginDto,
} from './dto/auth.dto';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

const logger = getLogger('AuthService');

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  role: 'CLIENT' | 'ADMIN';
};

@Injectable()
export class AuthService {
  private readonly otpExpiration = parseInt(
    process.env.OTP_EXPIRATION_MINUTES || '5',
    10,
  ) * 60 * 1000;
  private readonly accessTokenExpirationSeconds = parseInt(
    process.env.JWT_EXPIRATION || '900',
    10,
  );
  private readonly refreshTokenExpirationSeconds = parseInt(
    process.env.JWT_REFRESH_EXPIRATION || '1296000',
    10,
  );
  private readonly refreshTokenExpirationMs = this.refreshTokenExpirationSeconds * 1000;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ requestId: string }> {
    const normalizedPhone = this.normalizePhone(dto.phone);
    logger.log(`Sending OTP to phone: ${normalizedPhone}`);

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.otpExpiration);

    try {
      let user = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (!user) {
        user = await this.prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: `User ${dto.phone}`,
          role: 'CLIENT',
        },
      });
        logger.log(`Utilisateur créé: ${user.id}`);
      }

      await this.prisma.oTP.deleteMany({ where: { userId: user.id } });

      const otpRecord = await this.prisma.oTP.create({
        data: {
          userId: user.id,
          code: otp,
          expiresAt,
        },
      });

      await this.smsService.sendSms(normalizedPhone, `Votre code OTP est: ${otp}`);

      logger.log(`Code OTP envoyé avec succès à ${dto.phone}`);

      return { requestId: otpRecord.id };
    } catch (error) {
      logger.error('Échec de l\'envoi du code OTP:', error);
      throw new BadRequestException(
        ErrorCode.INVALID_INPUT,
        'Échec du traitement de la demande OTP',
      );
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<TokenResponse> {
    logger.log(`Verifying OTP for phone: ${dto.phone}`);

    try {
      const normalizedPhone = this.normalizePhone(dto.phone);
      let user = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (!user) {
        throw new NotFoundException('User');
      }

      const otpRecord = await this.prisma.oTP.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        throw new BadRequestException(
          ErrorCode.AUTH_OTP_INVALID,
          'No OTP found',
        );
      }

      if (new Date() > otpRecord.expiresAt) {
        await this.prisma.oTP.delete({ where: { id: otpRecord.id } });
        throw new BadRequestException(
          ErrorCode.AUTH_OTP_EXPIRED,
          'OTP has expired',
        );
      }

      if (otpRecord.code !== dto.otp) {
        await this.prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });

        if (otpRecord.attempts >= 5) {
          await this.prisma.oTP.delete({ where: { id: otpRecord.id } });
          throw new BadRequestException(
            ErrorCode.AUTH_OTP_MAX_ATTEMPTS,
            'Trop de tentatives échouées',
          );
        }

        throw new BadRequestException(
          ErrorCode.AUTH_OTP_INVALID,
          'Code OTP invalide',
        );
      }

      await this.prisma.oTP.delete({ where: { id: otpRecord.id } });

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'CLIENT' },
      });

      const tokens = await this.issueTokens({
        sub: user.id,
        phone: user.phone,
        role: user.role as 'CLIENT' | 'ADMIN',
      });

      logger.log(`Code OTP vérifié avec succès pour ${dto.phone}`);

      return tokens;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      logger.error('Échec de la vérification OTP:', error);
      throw new BadRequestException(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Erreur de vérification',
      );
    }
  }

  async adminLogin(dto: AdminLoginDto): Promise<TokenResponse> {
    logger.log(`Tentative de connexion admin: ${dto.email}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user || user.role !== 'ADMIN' || !user.password) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      const tokens = await this.issueTokens({
        sub: user.id,
        phone: user.phone,
        role: user.role as 'CLIENT' | 'ADMIN',
      });

      logger.log(`Connexion admin réussie: ${dto.email}`);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      logger.error('Erreur lors de la connexion admin:', error);
      throw new BadRequestException(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Erreur de connexion',
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const stored = await this.refreshTokenService.fetchValid(refreshToken, payload.sub);

      if (!stored) {
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      await this.refreshTokenService.revokeById(stored.id);

      return this.issueTokens({
        sub: payload.sub,
        phone: payload.phone,
        role: payload.role,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const stored = await this.refreshTokenService.fetchValid(refreshToken, userId);
      if (stored) {
        await this.refreshTokenService.revokeById(stored.id);
      }
      return;
    }

    await this.refreshTokenService.revokeByUserId(userId);
  }

  private async issueTokens(payload: {
    sub: string;
    phone: string;
    role: 'CLIENT' | 'ADMIN';
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    role: 'CLIENT' | 'ADMIN';
  }> {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: this.accessTokenExpirationSeconds,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: this.refreshTokenExpirationSeconds,
    });

    const expiresAt = new Date(Date.now() + this.refreshTokenExpirationMs);
    await this.refreshTokenService.store(payload.sub, refreshToken, expiresAt);

    return { accessToken, refreshToken, role: payload.role };
  }

  private generateOtp(): string {
    const length = parseInt(process.env.OTP_LENGTH || '6', 10);
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/[^\d]/g, '');
    if (!digits) {
      return phone;
    }
    if (phone.trim().startsWith('+')) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }
}
