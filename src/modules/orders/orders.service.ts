import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import {
  NotFoundException,
  BadRequestException,
} from '@/core/exceptions/custom.exceptions';
import { ErrorCode } from '@/common/constants/error-codes';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { getLogger } from '@/common/utils/logger';

const logger = getLogger('OrdersService');

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(user?: JwtPayload, includeAll: boolean = false) {
    logger.log('Fetching orders');

    const where = {};

    // If user is CLIENT, only return their orders
    if (user && user.role === 'CLIENT' && !includeAll) {
      Object.assign(where, { userId: user.sub });
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user?: JwtPayload) {
    logger.log(`Fetching order ${id}`);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order');
    }

    // If CLIENT user, check if it's their order
    if (user && user.role === 'CLIENT' && order.userId !== user.sub) {
      throw new BadRequestException(
        ErrorCode.AUTH_FORBIDDEN,
        'Accès refusé',
      );
    }

    return order;
  }

  async create(dto: CreateOrderDto, userId: string) {
    logger.log(`Creating order for user ${userId}`);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        ErrorCode.ORDER_EMPTY,
        'Order must have at least one item',
      );
    }

    // Fetch all products to validate stock and calculate total
    let total = 0;

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          ErrorCode.PRODUCT_OUT_OF_STOCK,
          `Product ${product.name} has insufficient stock`,
        );
      }

      total += product.price * item.quantity;
    }

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        userId,
        customerName: dto.customerName,
        phone: dto.phone,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        total,
        items: {
          create: await Promise.all(
            dto.items.map(async (item) => {
              const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
              });

              return {
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                productSnapshot: {
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || '',
                  brand: product.brand,
                },
              };
            }),
          ),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    logger.log(`Commande créée: ${order.id}`);

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    logger.log(`Updating order ${id} status to ${dto.status}`);
    await this.findById(id); // Check if exists

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status.toUpperCase() as any },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  async getStats() {
    const total = await this.prisma.order.count();
    const pending = await this.prisma.order.count({
      where: { status: 'PENDING' },
    });
    const confirmed = await this.prisma.order.count({
      where: { status: 'CONFIRMED' },
    });
    const delivered = await this.prisma.order.count({
      where: { status: 'DELIVERED' },
    });

    return { total, pending, confirmed, delivered };
  }
}
