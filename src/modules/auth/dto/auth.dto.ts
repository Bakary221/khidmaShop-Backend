import { IsPhoneNumber, IsEnum, Length, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Numéro de téléphone au format international',
    example: '+33700000001',
  })
  @IsPhoneNumber(null, { message: 'Numéro de téléphone invalide' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+33700000001',
  })
  @IsPhoneNumber(null, { message: 'Numéro de téléphone invalide' })
  phone: string;

  @ApiProperty({
    description: 'Code OTP à 6 chiffres',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit avoir 6 caractères' })
  otp: string;
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
  @IsString()
  refreshToken: string;
}
