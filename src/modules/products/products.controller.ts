import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
const { memoryStorage } = require('multer');
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductsDto,
} from './dto/product.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/core/decorators/public.decorator';

const PRODUCT_IMAGE_MAX_SIZE_MB = parseInt(
  process.env.PRODUCT_IMAGE_MAX_SIZE_MB || '25',
  10,
);

type ProductUploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
};

type ProductUploadFiles = {
  images?: ProductUploadFile[];
};

const productUploadOptions = {
  storage: memoryStorage(),
  limits: {
    files: 10,
    fileSize: PRODUCT_IMAGE_MAX_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req: unknown, file: { mimetype?: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(
        new UnsupportedMediaTypeException('Seules les images sont acceptées'),
        false,
      );
      return;
    }

    cb(null, true);
  },
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products (with optional filters)' })
  async findAll(@Query() filters: FilterProductsDto) {
    return this.productsService.findAll(filters);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Obtenir les produits en vedette uniquement' })
  async findFeatured() {
    return this.productsService.findFeatured();
  }

  @Public()
  @Get('brands')
  @ApiOperation({ summary: 'Obtenir toutes les marques de produits' })
  async getBrands() {
    return this.productsService.getBrands();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get product statistics (admin only)' })
  async getStats() {
    return this.productsService.getStats();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product details' })
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], productUploadOptions))
  @ApiOperation({ summary: 'Create product (admin only)' })
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: ProductUploadFiles,
  ) {
    return this.productsService.create(dto, files?.images ?? []);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], productUploadOptions))
  @ApiOperation({ summary: 'Update product (admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: ProductUploadFiles,
  ) {
    return this.productsService.update(id, dto, files?.images ?? []);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Basculer l\'\u00e9tat actif du produit (administrateur uniquement)' })
  async toggleActive(
    @Param('id') id: string,
    @Body() { active }: { active: boolean },
  ) {
    return this.productsService.toggleActive(id, active);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete product (admin only)' })
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
