import { IsString, IsBoolean, IsOptional, IsUrl, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsUrl()
  @IsString()
  image: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
