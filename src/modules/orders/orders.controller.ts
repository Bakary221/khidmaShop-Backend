import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, CheckPhoneDto, CreateGuestOrderDto, CancelGuestOrderDto } from './dto/order.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { Public } from '@/core/decorators/public.decorator';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get orders (own for clients, all for admins)',
  })
  async findAll(@CurrentUser() user: JwtPayload) {
    const includeAll = user.role === 'ADMIN';
    return this.ordersService.findAll(user, includeAll);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get order statistics (admin only)' })
  async getStats() {
    return this.ordersService.getStats();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async findById(
    @Param('id') id: string,
  ) {
    return this.ordersService.findByIdPublic(id);
  }

  @Public()
  @Post('search')
  @ApiOperation({ summary: 'Search orders by phone number' })
  async searchOrders(@Body() dto: CheckPhoneDto) {
    return this.ordersService.searchOrdersByPhone(dto.phone);
  }

  @Post()
  @ApiOperation({ summary: 'Create new order (clients)' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.create(dto, user);
  }

  @Public()
  @Post('check-phone')
  @ApiOperation({ summary: 'Check if phone exists in database' })
  async checkPhone(@Body() dto: CheckPhoneDto) {
    return this.ordersService.checkPhoneExists(dto.phone);
  }

  @Public()
  @Post('guest')
  @ApiOperation({ summary: 'Create guest order without authentication' })
  async createGuestOrder(@Body() dto: CreateGuestOrderDto) {
    return this.ordersService.createGuestOrder(dto);
  }

  @Public()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order by phone (guest or authenticated)' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelGuestOrderDto,
  ) {
    return this.ordersService.cancelOrderByPhone(id, dto.phone);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
