import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    UsersModule,
    DashboardModule,
    OrdersModule,
  ],
})
export class AppModule {}
