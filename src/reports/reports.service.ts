import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats(tenantId: string) {
    // 1. Total Sales (All Time)
    const totalSales = await this.prisma.sale.aggregate({
      where: { tenantId },
      _sum: { totalAmount: true },
    });

    // 2. Count Active Cashiers
    const activeCashiers = await this.prisma.user.count({
      where: { tenantId, role: Role.CASHIER },
    });

    // 3. Low Stock Products (stockLevel <= minStockLevel)
    const lowStockResult = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int as count FROM products 
      WHERE "tenantId" = ${tenantId} 
      AND "stockLevel" <= "minStockLevel";
    `;
    const lowStockCount = lowStockResult[0]?.count || 0;

    // 4. Recent Sales (Last 5)
    const recentSales = await this.prisma.sale.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });

    return {
      totalSalesVolume: totalSales._sum.totalAmount || 0,
      activeCashiers,
      lowStockAlerts: lowStockCount,
      recentSales,
    };
  }

  async getSalesReport(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.sale.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAuditReport(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
