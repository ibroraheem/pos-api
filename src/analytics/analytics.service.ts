import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async calculateValuation(tenantId: string) {
        const products = await this.prisma.product.findMany({
            where: { tenantId },
            select: {
                stockLevel: true,
                costPrice: true,
                salePrice: true,
            },
        });

        let totalCostValue = 0;
        let totalRetailValue = 0;

        for (const p of products) {
            if (p.stockLevel > 0) {
                totalCostValue += p.stockLevel * p.costPrice;
                totalRetailValue += p.stockLevel * p.salePrice;
            }
        }

        return {
            totalCostValue,
            totalRetailValue,
            currency: 'NGN', // Integer (Kobo)
            potentialProfit: totalRetailValue - totalCostValue,
        };
    }
}
