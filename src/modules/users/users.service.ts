import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { NotFoundException } from '@/core/exceptions/custom.exceptions';
import { getLogger } from '@/common/utils/logger';

const logger = getLogger('UsersService');

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    logger.log('Fetching all users');
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        address: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    logger.log(`Fetching user ${id}`);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        address: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    logger.log(`Creating user with phone ${dto.phone}`);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        avatar: dto.avatar,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        address: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    logger.log(`Updating user ${id}`);
    await this.findById(id); // Check if exists

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        address: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    logger.log(`Deleting user ${id}`);
    await this.findById(id); // Check if exists

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async getStats() {
    return this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });
  }
}
