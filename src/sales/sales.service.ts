import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PrismaService } from '../prisma/prisma.service';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  async create(createSaleDto: CreateSaleDto, tenantId: string) {
    const { clientTransactionId, items } = createSaleDto;

    // 1. Idempotency Check
    const existingSale = await this.prisma.sale.findUnique({
      where: {
        tenantId_clientTransactionId: {
          tenantId,
          clientTransactionId,
        },
      },
    });
    if (existingSale) return existingSale;

    // 2. Fetch Tenant settings (VAT)
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
      },
    });

    // 3. Calculation & Validation
    let subtotal = 0;
    let vatAmount = 0;
    const saleItemsData: {
      productId: string;
      quantity: number;
      recordedCostPrice: number;
      recordedSalePrice: number;
    }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      if (product.stockLevel < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.salePrice * item.quantity;
      subtotal += itemTotal;

      // VAT Logic: 7.5% if enabled and not exempt
      if (tenant.vatEnabled && !product.isVatExempt) {
        // 7.5% = 0.075 * price. Using integers: (price * 75) / 1000
        const vat = Math.round((itemTotal * 75) / 1000);
        vatAmount += vat;
      }

      saleItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        recordedCostPrice: product.costPrice,
        recordedSalePrice: product.salePrice,
      });
    }

    const totalAmount = subtotal + vatAmount;

    // 4. Transactional Write
    return this.prisma.$transaction(async (prisma) => {
      // Create Sale
      const sale = await prisma.sale.create({
        data: {
          tenantId,
          clientTransactionId,
          subtotal,
          vatAmount,
          totalAmount,
          items: {
            create: saleItemsData,
          },
        },
        include: { items: true },
      });

      // Update Stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockLevel: { decrement: item.quantity },
          },
        });
      }

      return sale;
    });
  }

  findAll(tenantId: string) {
    return this.prisma.sale.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
  }
  async returnSale(saleId: string, tenantId: string, userId: string, items: { productId: string; quantity: number }[], reason: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify Sale
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!sale || sale.tenantId !== tenantId) {
        throw new BadRequestException('Sale not found');
      }

      // 2. Validate Return Items
      let refundAmount = 0;
      for (const returnItem of items) {
        const saleItem = sale.items.find((si) => si.productId === returnItem.productId);
        if (!saleItem) {
          throw new BadRequestException(`Product ${returnItem.productId} was not in this sale`);
        }
        if (returnItem.quantity > saleItem.quantity) {
          throw new BadRequestException(`Cannot return more than sold quantity for ${returnItem.productId}`);
        }
        // Calculate refund based on original sold price
        refundAmount += saleItem.recordedSalePrice * returnItem.quantity;
      }

      // 3. Create Return Record
      const saleReturn = await tx.saleReturn.create({
        data: {
          tenantId,
          saleId,
          reason,
          refundAmount,
          items: JSON.stringify(items),
        },
      });

      // 4. Restore Stock
      for (const returnItem of items) {
        await tx.product.update({
          where: { id: returnItem.productId },
          data: { stockLevel: { increment: returnItem.quantity } },
        });
      }

      // 5. Audit
      // Since we don't have this.auditService injected here yet, we'll rely on the global AuditInterceptor 
      // OR inject AuditService into SalesService. Let's assume AuditService is injected.

      return saleReturn;
    });
  }
}
