import { IsString, IsEmail, IsPhoneNumber, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsPhoneNumber(null)
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
