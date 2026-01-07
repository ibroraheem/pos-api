import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { SubscriptionModule } from './subscription/subscription.module';
import { SyncModule } from './sync/sync.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, SalesModule, SubscriptionModule, SyncModule, AdminModule, UsersModule, AuditModule, ReportsModule],
  controllers: [AppController, AnalyticsController],
  providers: [AppService, AnalyticsService],
})
export class AppModule {}
