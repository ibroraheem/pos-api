import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async findAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { sales: true, products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // In a real app, aggregation of Total Sales Volume might be heavy.
    // Here we can do a separate aggregate query or just return count.
    // Let's iterate and calculate total sales volume for "Business Logic" compliance.
    // "View all stores, their total sales volume"

    const tenantStats = await Promise.all(
      tenants.map(async (tenant) => {
        const salesAgg = await this.prisma.sale.aggregate({
          where: { tenantId: tenant.id },
          _sum: { totalAmount: true },
        });

        return {
          ...tenant,
          totalSalesVolume: salesAgg._sum.totalAmount || 0,
        };
      })
    );

    return tenantStats;
  }

  async toggleSubscription(tenantId: string, status: SubscriptionStatus) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: status },
    });
  }

  // In-memory Global Pricing (Single Tier)
  private pricingConfig = {
    standard: { monthly: 500000, annual: 5000000 }, // 5k/50k NGN
  };

  getPricing() {
    return this.pricingConfig;
  }

  updatePricing(newPricing: any) {
    // Expects { monthly: number, annual: number }
    if (newPricing.monthly && newPricing.annual) {
      this.pricingConfig.standard = { ...newPricing };
    }
    return this.pricingConfig;
  }
}
