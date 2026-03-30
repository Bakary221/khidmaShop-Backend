import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '@/common/services/prisma.service';
import { CloudinaryService } from '@/common/services/cloudinary.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, CloudinaryService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
