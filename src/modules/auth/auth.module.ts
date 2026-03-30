import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '@/common/services/prisma.service';
import { SmsModule } from '../sms/sms.module';
import { RefreshTokenService } from '@/common/services/refresh-token.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService, RefreshTokenService],
  exports: [AuthService],
})
export class AuthModule {}
