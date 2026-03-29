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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductsDto,
} from './dto/product.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/core/decorators/public.decorator';

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
  @ApiOperation({ summary: 'Create product (admin only)' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
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
