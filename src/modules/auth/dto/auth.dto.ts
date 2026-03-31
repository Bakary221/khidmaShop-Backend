import {
  IsEnum,
  IsString,
  IsOptional,
  Length,
  Matches,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class SendOtpDto {
  @ApiProperty({
    description: 'Numéro de téléphone (avec le préfixe pays ou sans)',
    example: '+33700000001',
  })
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'Numéro de téléphone invalide',
  })
  phone: string;

  @ApiProperty({
    description: 'Role associé à la demande',
    example: 'CLIENT',
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+33700000001',
  })
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'Numéro de téléphone invalide',
  })
  phone: string;

  @ApiProperty({
    description: 'Code OTP à 6 chiffres',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit avoir 6 caractères' })
  otp: string;

  @ApiProperty({
    description: 'Role associé à la vérification',
    example: 'CLIENT',
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class AdminLoginDto {
  @ApiProperty({
    description: 'Email de l\'administrateur',
    example: 'admin@khidma.shop',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'administrateur',
    example: 'khidma123',
  })
  @IsString()
  @Length(6, 50)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Jeton de rafraîchissement',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
