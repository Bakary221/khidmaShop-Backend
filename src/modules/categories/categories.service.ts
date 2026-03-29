import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  NotFoundException,
  ConflictException,
} from '@/core/exceptions/custom.exceptions';
import { ErrorCode } from '@/common/constants/error-codes';
import { getLogger } from '@/common/utils/logger';

const logger = getLogger('CategoriesService');

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive?: boolean) {
    logger.log('Fetching categories');
    const where = includeInactive ? {} : { active: true };

    return this.prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    logger.log(`Fetching category ${id}`);
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    logger.log(`Creating category: ${dto.name}`);
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        image: dto.image,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    logger.log(`Updating category ${id}`);
    await this.findById(id); // Check if exists

    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug || (dto.name ? dto.name.toLowerCase().replace(/\s+/g, '-') : undefined),
      },
    });
  }

  async toggleActive(id: string, active: boolean) {
    logger.log(`Toggling category ${id} active to ${active}`);
    await this.findById(id); // Check if exists

    return this.prisma.category.update({
      where: { id },
      data: { active },
    });
  }

  async delete(id: string) {
    logger.log(`Deleting category ${id}`);
    await this.findById(id); // Check if exists

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        ErrorCode.CATEGORY_NOT_EMPTY,
        `Cannot delete category with ${productCount} products`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Catégorie supprimée avec succès' };
  }
}
