import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreateGuestOrderDto } from './dto/order.dto';
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

    if (user && user.role === 'CLIENT' && order.userId !== user.sub) {
      throw new BadRequestException(
        ErrorCode.AUTH_FORBIDDEN,
        'Accès refusé',
      );
    }

    return order;
  }

  async findByIdPublic(id: string) {
    logger.log(`Fetching public order ${id}`);

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

    return order;
  }

  private isProfileIncomplete(user: User) {
    const trimmedName = user.name?.trim() ?? '';
    const trimmedAddress = user.address?.trim() ?? '';

    if (!trimmedName || !trimmedAddress) {
      return true;
    }

    const normalizedName = trimmedName.toLowerCase();
    if (normalizedName.startsWith('user ')) {
      return true;
    }

    const normalizedPhone = user.phone?.trim().toLowerCase() ?? '';
    if (normalizedName === normalizedPhone) {
      return true;
    }

    return false;
  }

  async create(dto: CreateOrderDto, user: JwtPayload) {
    logger.log(`Creating order for user ${user.sub}`);

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    if (!dbUser) {
      throw new NotFoundException('User');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        ErrorCode.ORDER_EMPTY,
        'Order must have at least one item',
      );
    }

    const customerName = dto.customerName.trim();
    const customerAddress = dto.address?.trim();

    if (!customerName) {
      throw new BadRequestException(
        ErrorCode.INVALID_INPUT,
        'Le nom du client est requis',
      );
    }

    const requiresProfileUpdate = this.isProfileIncomplete(dbUser);

    if (requiresProfileUpdate) {
      if (!customerAddress) {
        throw new BadRequestException(
          ErrorCode.USER_PROFILE_INCOMPLETE,
          'Adresse requise pour finaliser la première commande',
        );
      }

      await this.prisma.user.update({
        where: { id: user.sub },
        data: {
          name: customerName,
          address: customerAddress,
        },
      });
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

    const orderAddress = customerAddress ?? undefined;

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        userId: user.sub,
        customerName,
        phone: dto.phone,
        address: orderAddress,
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

  async cancelOrder(id: string, user: JwtPayload) {
    logger.log(`Cancelling order ${id} by user ${user.sub}`);

    const order = await this.findById(id, user);

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        ErrorCode.ORDER_CANNOT_CANCEL,
        'Seules les commandes en attente peuvent être annulées',
      );
    }

    const CANCEL_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
    const elapsed = Date.now() - new Date(order.createdAt).getTime();

    if (elapsed > CANCEL_WINDOW_MS) {
      throw new BadRequestException(
        ErrorCode.ORDER_CANCEL_WINDOW_EXPIRED,
        'Le délai d\'annulation de 30 minutes est dépassé',
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  async cancelOrderByPhone(orderId: string, phone: string) {
    logger.log(`Cancelling order ${orderId} by phone ${phone}`);

    const normalizedPhone = this.normalizePhone(phone);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande');
    }

    if (order.phone !== normalizedPhone) {
      throw new BadRequestException(
        ErrorCode.AUTH_FORBIDDEN,
        'Numéro de téléphone ne correspond pas à cette commande',
      );
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        ErrorCode.ORDER_CANNOT_CANCEL,
        'Seules les commandes en attente peuvent être annulées',
      );
    }

    const CANCEL_WINDOW_MS = 30 * 60 * 1000;
    const elapsed = Date.now() - new Date(order.createdAt).getTime();

    if (elapsed > CANCEL_WINDOW_MS) {
      throw new BadRequestException(
        ErrorCode.ORDER_CANCEL_WINDOW_EXPIRED,
        'Le délai d\'annulation de 30 minutes est dépassé',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
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

  async searchOrdersByPhone(phone: string) {
    logger.log(`Searching orders by phone: ${phone}`);
    
    const normalizedPhone = this.normalizePhone(phone);
    
    const orders = await this.prisma.order.findMany({
      where: { phone: normalizedPhone },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async checkPhoneExists(phone: string) {
    logger.log(`Checking phone: ${phone}`);
    
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, address: true },
    });

    if (user) {
      return { exists: true, user: { id: user.id, name: user.name, address: user.address ?? undefined } };
    }

    return { exists: false };
  }

  async createGuestOrder(dto: CreateGuestOrderDto) {
    logger.log(`Creating guest order for phone: ${dto.phone}`);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        ErrorCode.ORDER_EMPTY,
        'La commande doit contenir au moins un article',
      );
    }

    const normalizedPhone = this.normalizePhone(dto.phone);
    let user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      if (!dto.customerName || !dto.address) {
        throw new BadRequestException(
          ErrorCode.USER_PROFILE_INCOMPLETE,
          'Pour une première commande, le nom et l\'adresse sont requis',
        );
      }

      user = await this.prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: dto.customerName,
          address: dto.address,
          role: 'CLIENT',
        },
      });
      logger.log(`Guest user created: ${user.id}`);
    } else if (dto.customerName || dto.address) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(dto.customerName && { name: dto.customerName }),
          ...(dto.address && { address: dto.address }),
        },
      });
    }

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
          `Le produit ${product.name} n'a pas assez de stock`,
        );
      }

      total += product.price * item.quantity;
    }

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        customerName: dto.customerName ?? user.name,
        phone: normalizedPhone,
        address: dto.address ?? user.address,
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

    logger.log(`Guest order created: ${order.id}`);

    return order;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/[^\d]/g, '');
    if (!digits) {
      return phone;
    }
    if (phone.trim().startsWith('+')) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }
}
