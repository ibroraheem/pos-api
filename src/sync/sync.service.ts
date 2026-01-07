import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) { }

  async pull(tenantId: string, lastPulledAt?: string) {
    const timestamp = lastPulledAt ? new Date(lastPulledAt) : new Date(0);

    const [products, sales] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          tenantId,
          updatedAt: { gt: timestamp },
        },
      }),
      this.prisma.sale.findMany({
        where: {
          tenantId,
          createdAt: { gt: timestamp },
        },
        include: { items: true },
      }),
    ]);

    return {
      products,
      sales,
      lastPulledAt: new Date(),
    };
  }
}
