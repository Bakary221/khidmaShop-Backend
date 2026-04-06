import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [String(value).trim()].filter(Boolean);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => String(entry).trim())
        .filter(Boolean);
    }
  } catch {
    // Fallback to comma-separated values for legacy form payloads.
  }

  return trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const toNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const normalized = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(normalized);
};

export class CreateProductDto {
  @ApiProperty({
    description: 'Nom du produit',
    example: 'Pizza Margherita',
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Slug du produit',
    example: 'pizza-margherita',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'URLs d\'images existantes ou héritées (compatibilité legacy)',
    example: ['https://example.com/pizza.jpg'],
    required: false,
  })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'Images à conserver lors d\'une mise à jour multipart',
    example: ['https://example.com/pizza.jpg'],
    required: false,
  })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  existingImages?: string[];

  @ApiProperty({
    description: 'Prix du produit en euros',
    example: 10.99,
  })
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'ID de la catégorie',
    example: 'cat_1',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({
    description: 'Marque du produit',
    example: 'KhidmaShop',
  })
  @IsString()
  brand: string;

  @ApiProperty({
    description: 'Description du produit',
    example: 'Pizza tomate classique avec mozzarella',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Tailles disponibles',
    example: ['S', 'M', 'L'],
    required: false,
  })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @ApiProperty({
    description: 'Couleurs disponibles',
    example: ['Rouge', 'Bleu'],
    required: false,
  })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

  @ApiProperty({
    description: 'Quantité en stock',
    example: 50,
  })
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Note du produit',
    example: 4.5,
    required: false,
  })
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  @Min(0)
  rating?: number;

  @ApiProperty({
    description: 'Produit en vedette',
    example: true,
    required: false,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiProperty({
    description: 'Produit actif',
    example: true,
    required: false,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  price?: number;

  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  existingImages?: string[];

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  stock?: number;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  rating?: number;

  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class FilterProductsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
