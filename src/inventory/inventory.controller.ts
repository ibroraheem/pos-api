import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateStockAdjustmentDto } from './dto/stock-adjustment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TENANT_ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  // Suppliers
  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto, @Request() req) {
    return this.inventoryService.createSupplier(dto, req.user.tenantId);
  }

  @Get('suppliers')
  findAllSuppliers(@Request() req) {
    return this.inventoryService.findAllSuppliers(req.user.tenantId);
  }

  // Purchase Orders
  @Post('purchase-orders')
  createPO(@Body() dto: CreatePurchaseOrderDto, @Request() req) {
    return this.inventoryService.createPurchaseOrder(dto, req.user.tenantId, req.user.userId);
  }

  @Get('purchase-orders')
  findAllPOs(@Request() req) {
    return this.inventoryService.findAllPOs(req.user.tenantId);
  }

  @Patch('purchase-orders/:id/receive')
  receivePO(@Param('id') id: string, @Request() req) {
    return this.inventoryService.receivePurchaseOrder(id, req.user.tenantId, req.user.userId);
  }

  // Stock Adjustments
  @Post('adjustments')
  createAdjustment(@Body() dto: CreateStockAdjustmentDto, @Request() req) {
    return this.inventoryService.createStockAdjustment(dto, req.user.tenantId, req.user.userId);
  }

  @Get('adjustments')
  findAllAdjustments(@Request() req) {
    return this.inventoryService.findAllAdjustments(req.user.tenantId);
  }
}
