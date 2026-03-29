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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/core/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll(
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.categoriesService.findAll(includeInactive);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category details' })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create category (admin only)' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update category (admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Basculer l\'\u00e9tat actif de la catégorie (administrateur uniquement)' })
  async toggleActive(
    @Param('id') id: string,
    @Body() { active }: { active: boolean },
  ) {
    return this.categoriesService.toggleActive(id, active);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete category (admin only)' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
