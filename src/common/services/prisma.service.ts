import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getLogger } from './../../common/utils/logger';

const logger = getLogger('PrismaService');

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    logger.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    logger.log('❌ Prisma disconnected from database');
  }
}
