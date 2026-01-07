import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateStockAdjustmentDto } from './dto/stock-adjustment.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  // --- Supplier Management ---
  async createSupplier(dto: CreateSupplierDto, tenantId: string) {
    return this.prisma.supplier.create({
      data: { ...dto, tenantId },
    });
  }

  async findAllSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Purchase Orders ---
  async createPurchaseOrder(dto: CreatePurchaseOrderDto, tenantId: string, userId: string) {
    const { supplierId, items } = dto;
    let totalCost = 0;

    // Calculate total cost and validate items
    for (const item of items) {
      totalCost += item.quantity * item.unitCost;
    }

    const po = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId,
        totalCost,
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: { items: true },
    });

    await this.auditService.logAction(userId, tenantId, 'PO_CREATED', { poId: po.id, totalCost });
    return po;
  }

  async findAllPOs(tenantId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async receivePurchaseOrder(id: string, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!po || po.tenantId !== tenantId) {
        throw new NotFoundException('Purchase Order not found');
      }
      if (po.status !== 'PENDING') {
        throw new BadRequestException('PO is already processed');
      }

      // Update PO Status
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'COMPLETED', receivedAt: new Date() },
      });

      // Increment Stock for each item
      for (const item of po.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockLevel: { increment: item.quantity } },
        });
      }

      // Log Audit
      await this.auditService.logAction(userId, tenantId, 'STOCK_RECEIVED', { poId: id, items: po.items.length }, 'SYSTEM'); // Using 'SYSTEM' or passing IP if available (controller can pass generic)

      return { message: 'Stock received successfully', poId: id };
    });
  }

  // --- Stock Adjustments (Shrinkage/Damages) ---
  async createStockAdjustment(dto: CreateStockAdjustmentDto, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product || product.tenantId !== tenantId) throw new NotFoundException('Product not found');

      // Create Record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          tenantId,
          productId: dto.productId,
          quantity: dto.quantity,
          reason: dto.reason,
          userId,
        },
      });

      // Update Product Stock (Increment handles negative numbers too)
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockLevel: { increment: dto.quantity } },
      });

      return adjustment;
    });
  }

  async findAllAdjustments(tenantId: string) {
    return this.prisma.stockAdjustment.findMany({
      where: { tenantId },
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
