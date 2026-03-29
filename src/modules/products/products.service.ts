import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductsDto,
} from './dto/product.dto';
import { NotFoundException } from '@/core/exceptions/custom.exceptions';
import { getLogger } from '@/common/utils/logger';

const logger = getLogger('ProductsService');

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: FilterProductsDto) {
    logger.log('Fetching products with filters', filters);

    const where: any = {};

    if (!filters?.includeInactive) {
      where.active = true;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.brand) {
      where.brand = { contains: filters.brand, mode: 'insensitive' };
    }

    if (filters?.maxPrice) {
      where.price = { lte: filters.maxPrice };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    logger.log(`Fetching product ${id}`);
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product');
    }

    return product;
  }

  async findFeatured() {
    logger.log('Récupération des produits en vedette');
    return this.prisma.product.findMany({
      where: { featured: true, active: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateProductDto) {
    logger.log(`Creating product: ${dto.name}`);
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        price: dto.price,
        images: dto.images,
        categoryId: dto.categoryId,
        brand: dto.brand,
        description: dto.description,
        sizes: dto.sizes || [],
        colors: dto.colors || [],
        featured: dto.featured || false,
        stock: dto.stock,
        rating: dto.rating || 0,
        active: dto.active ?? true,
      },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    logger.log(`Updating product ${id}`);
    await this.findById(id); // Check if exists

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug || (dto.name ? dto.name.toLowerCase().replace(/\s+/g, '-') : undefined),
      },
      include: { category: true },
    });
  }

  async toggleActive(id: string, active: boolean) {
    logger.log(`Toggling product ${id} active to ${active}`);
    await this.findById(id); // Check if exists

    return this.prisma.product.update({
      where: { id },
      data: { active },
      include: { category: true },
    });
  }

  async delete(id: string) {
    logger.log(`Deleting product ${id}`);
    await this.findById(id); // Check if exists

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Produit supprimé avec succès' };
  }

  async getBrands() {
    logger.log('Récupération de toutes les marques');
    const brands = await this.prisma.product.findMany({
      distinct: ['brand'],
      select: { brand: true },
      where: { active: true },
    });

    return brands.map((b) => b.brand);
  }

  async getStats() {
    const total = await this.prisma.product.count();
    const featured = await this.prisma.product.count({
      where: { featured: true },
    });
    const categories = await this.prisma.category.count();

    return { total, featured, categories };
  }
}
