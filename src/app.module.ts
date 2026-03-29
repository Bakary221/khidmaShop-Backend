import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { PrismaService } from './common/services/prisma.service';
import { JwtGuard } from './common/guards/jwt.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SmsModule } from './modules/sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    SmsModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
