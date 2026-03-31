import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  AdminLoginDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { Public } from '@/core/decorators/public.decorator';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ROLE_COOKIE,
  getCookieValue,
} from '@/common/utils/cookies.util';

const accessTokenMaxAge = parseInt(process.env.JWT_EXPIRATION || '900', 10);
const refreshTokenMaxAge = parseInt(process.env.JWT_REFRESH_EXPIRATION || '1296000', 10);

const envSameSite = (process.env.JWT_COOKIE_SAMESITE as 'lax' | 'strict' | 'none') ?? 'none';
const forceSecure = (() => {
  if (process.env.JWT_COOKIE_SECURE) {
    return process.env.JWT_COOKIE_SECURE === 'true';
  }
  return process.env.NODE_ENV === 'production';
})();

const baseCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  path: '/',
  sameSite: forceSecure ? envSameSite : 'lax',
  secure: forceSecure,
  maxAge: maxAgeSeconds * 1000,
});

const ACCESS_TOKEN_COOKIE_OPTIONS = baseCookieOptions(accessTokenMaxAge);
const REFRESH_TOKEN_COOKIE_OPTIONS = baseCookieOptions(refreshTokenMaxAge);

function optionalCookie<T extends object>(options: T) {
  return {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  };
}

function extractRefreshToken(request: Request, body?: RefreshTokenDto) {
  if (body?.refreshToken) return body.refreshToken;
  return getCookieValue(request.headers.cookie, REFRESH_TOKEN_COOKIE);
}

function attachAuthCookies(res: Response, accessToken: string, refreshToken: string, role: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  res.cookie(ROLE_COOKIE, role, REFRESH_TOKEN_COOKIE_OPTIONS);
}

function clearAuthCookies(res: Response) {
  res.cookie(ACCESS_TOKEN_COOKIE, '', optionalCookie(ACCESS_TOKEN_COOKIE_OPTIONS));
  res.cookie(REFRESH_TOKEN_COOKIE, '', optionalCookie(REFRESH_TOKEN_COOKIE_OPTIONS));
  res.cookie(ROLE_COOKIE, '', optionalCookie(REFRESH_TOKEN_COOKIE_OPTIONS));
}

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
  @ApiOperation({ summary: 'Vérifier le code OTP et démarrer une session client' })
  @ApiResponse({
    status: 200,
    description: 'Authentification réussie',
  })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.verifyOtp(dto);
    attachAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.role);
    return {
      accessToken: tokens.accessToken,
      role: tokens.role,
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
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.adminLogin(dto);
    attachAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.role);
    return {
      accessToken: tokens.accessToken,
      role: tokens.role,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le jeton d\'accès' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = extractRefreshToken(req, dto);
    if (!refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement manquant');
    }

    const tokens = await this.authService.refreshToken(refreshToken);
    attachAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.role);
    return {
      accessToken: tokens.accessToken,
      role: tokens.role,
    };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion et invalidation du refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('sub') userId: string,
  ) {
    const refreshToken = extractRefreshToken(req);
    await this.authService.logout(userId, refreshToken ?? undefined);
    clearAuthCookies(res);
    return { message: 'Déconnecté avec succès' };
  }
}
