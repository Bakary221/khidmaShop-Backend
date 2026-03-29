import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/common/services/prisma.service';
import { SmsService } from '@/modules/sms/sms.service';
import { getLogger } from '@/common/utils/logger';
import {
  BadRequestException,
  UnauthorizedException,
  ConflictException,
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

@Injectable()
export class AuthService {
  private readonly otpExpiration = parseInt(
    process.env.OTP_EXPIRATION_MINUTES || '5',
  ) * 60 * 1000; // Convert to ms

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ requestId: string }> {
    logger.log(`Sending OTP to phone: ${dto.phone}`);

    // Generate 6-digit OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.otpExpiration);

    try {
      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      // If user doesn't exist, create a temporary one for first-time login
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            phone: dto.phone,
            name: `User ${dto.phone}`, // Temp name
            role: 'CLIENT', // Always CLIENT for phone auth
          },
        });
        logger.log(`Utilisateur créé: ${user.id}`);
      }

      // Delete old OTPs
      await this.prisma.oTP.deleteMany({
        where: { userId: user.id },
      });

      // Create new OTP
      const otpRecord = await this.prisma.oTP.create({
        data: {
          userId: user.id,
          code: otp,
          expiresAt,
        },
      });

      // Send SMS (development mode logs the OTP)
      await this.smsService.sendSms(dto.phone, `Votre code OTP est: ${otp}`);

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

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    logger.log(`Verifying OTP for phone: ${dto.phone}`);

    try {
      // Find user
      let user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (!user) {
        throw new NotFoundException('User');
      }

      // Find latest OTP
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

      // Check expiration
      if (new Date() > otpRecord.expiresAt) {
        await this.prisma.oTP.delete({ where: { id: otpRecord.id } });
        throw new BadRequestException(
          ErrorCode.AUTH_OTP_EXPIRED,
          'OTP has expired',
        );
      }

      // Verify code
      if (otpRecord.code !== dto.otp) {
        // Increment attempts
        await this.prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });

        // Check max attempts
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

      // Clean up OTP
      await this.prisma.oTP.delete({ where: { id: otpRecord.id } });

      // Update user details if provided
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'CLIENT' },
      });

      // Generate tokens
      const tokens = await this.generateTokens({
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

  async adminLogin(dto: AdminLoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    logger.log(`Tentative de connexion admin: ${dto.email}`);

    try {
      // Trouver l'utilisateur admin par email
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user || user.role !== 'ADMIN' || !user.password) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      // Générer les tokens
      const tokens = await this.generateTokens({
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

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      return this.generateTokens({
        sub: payload.sub,
        phone: payload.phone,
        role: payload.role,
      });
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  private async generateTokens(payload: {
    sub: string;
    phone: string;
    role: 'CLIENT' | 'ADMIN';
  }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: parseInt(process.env.JWT_EXPIRATION || '900'), // seconds
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800'), // seconds
    });

    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    const length = parseInt(process.env.OTP_LENGTH || '6');
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }
}
