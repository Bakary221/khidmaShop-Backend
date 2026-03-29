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
    description: 'URL de l\'image du produit',
    example: 'https://example.com/pizza.jpg',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'Prix du produit en euros',
    example: 10.99,
  })
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
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @ApiProperty({
    description: 'Couleurs disponibles',
    example: ['Rouge', 'Bleu'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

  @ApiProperty({
    description: 'Quantité en stock',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Note du produit',
    example: 4.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rating?: number;

  @ApiProperty({
    description: 'Produit en vedette',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiProperty({
    description: 'Produit actif',
    example: true,
    required: false,
  })
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

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  sizes?: string[];

  @IsArray()
  @IsOptional()
  colors?: string[];

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  rating?: number;

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
