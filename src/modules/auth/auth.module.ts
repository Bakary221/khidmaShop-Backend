import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '@/common/services/prisma.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
