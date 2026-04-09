import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CloudinaryService } from '@/common/services/cloudinary.service';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductsDto,
} from './dto/product.dto';
import { NotFoundException, BadRequestException } from '@/core/exceptions/custom.exceptions';
import { ErrorCode } from '@/common/constants/error-codes';
import { getLogger } from '@/common/utils/logger';

const logger = getLogger('ProductsService');

type ProductUploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

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

  async findFeatured(limit = 4) {
    logger.log('Récupération des produits en vedette');

    const featuredProducts = await this.prisma.product.findMany({
      where: { featured: true, active: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    if (featuredProducts.length >= limit) {
      return featuredProducts.slice(0, limit);
    }

    const featuredIds = featuredProducts.map((product) => product.id);
    const additionalProducts = await this.prisma.product.findMany({
      where: {
        active: true,
        id: { notIn: featuredIds },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit - featuredProducts.length,
    });

    return [...featuredProducts, ...additionalProducts];
  }

  async create(dto: CreateProductDto, files: ProductUploadFile[] = []) {
    logger.log(`Creating product: ${dto.name}`);
    const images = await this.resolveImages(dto.images, dto.existingImages, files);
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        price: dto.price,
        images,
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

  async update(
    id: string,
    dto: UpdateProductDto,
    files: ProductUploadFile[] = [],
  ) {
    logger.log(`Updating product ${id}`);
    await this.findById(id); // Check if exists

    const { images, existingImages, ...updateData } = dto;
    const hasImagePayload =
      images !== undefined ||
      existingImages !== undefined ||
      files.length > 0;
    const processedImages = hasImagePayload
      ? await this.resolveImages(images, existingImages, files)
      : undefined;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(processedImages ? { images: processedImages } : {}),
        slug:
          updateData.slug ||
          (updateData.name ? updateData.name.toLowerCase().replace(/\s+/g, '-') : undefined),
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

    try {
      await this.prisma.product.delete({
        where: { id },
      });
      return { message: 'Produit supprimé avec succès' };
    } catch (error: any) {
      logger.error(`Failed to delete product ${id}`, error.message);
      if (error.code === 'P2003') {
        throw new BadRequestException(
          ErrorCode.PRODUCT_HAS_ORDERS,
          'Ce produit ne peut pas être supprimé car il est lié à des commandes existantes',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Product');
      }
      throw new BadRequestException(
        ErrorCode.DATABASE_ERROR,
        'Impossible de supprimer ce produit',
      );
    }
  }

  async getBrands() {
    logger.log('Récupération de toutes les marques');
    const brands = await this.prisma.product.findMany({
      distinct: ['brand'],
      select: { brand: true },
      where: { active: true },
    });

    return brands.map(({ brand }: { brand: string }) => brand);
  }

  async getStats() {
    const total = await this.prisma.product.count();
    const featured = await this.prisma.product.count({
      where: { featured: true },
    });
    const categories = await this.prisma.category.count();

    return { total, featured, categories };
  }

  private async uploadImages(images?: string[]) {
    const safeImages = images?.filter((url) => Boolean(url)) ?? [];
    if (!safeImages.length) {
      return [];
    }

    return this.cloudinary.uploadMany(safeImages);
  }

  private async resolveImages(
    images?: string[],
    existingImages?: string[],
    files: ProductUploadFile[] = [],
  ) {
    const preservedImages = existingImages?.filter((url) => Boolean(url)) ?? [];
    const legacyImages = images?.filter((url) => Boolean(url)) ?? [];
    const uploadedLegacyImages = legacyImages.length
      ? await this.uploadImages(legacyImages)
      : [];
    const uploadedFiles = files.length
      ? await this.cloudinary.uploadManyFiles(files)
      : [];

    return [...new Set([...preservedImages, ...uploadedLegacyImages, ...uploadedFiles])];
  }
}
