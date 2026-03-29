import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, AdminLoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from '@/core/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un code OTP au numéro de téléphone' })
  @ApiResponse({ status: 200, description: 'Code OTP envoyé avec succès' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier le code OTP et obtenir les tokens' })
  @ApiResponse({
    status: 200,
    description: 'Authentification réussie',
    schema: {
      example: {
        success: true,
        message: 'Authentification réussie',
        data: {
          accessToken: 'eyJhbGc...',
          refreshToken: 'eyJhbGc...',
        },
        error: null,
      },
    },
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const tokens = await this.authService.verifyOtp(dto);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Public()
  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Connexion administrateur réussie',
  })
  async adminLogin(@Body() dto: AdminLoginDto) {
    const tokens = await this.authService.adminLogin(dto);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le jeton d\'accès' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshToken(dto.refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
