import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user (admin only)' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
