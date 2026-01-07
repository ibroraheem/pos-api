import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSaleReturnDto } from './dto/create-sale-return.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../subscription/subscription.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@UseInterceptors(AuditInterceptor)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Post()
  create(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    return this.salesService.create(createSaleDto, req.user.tenantId);
  }

  @Get()
  findAll(@Request() req) {
    return this.salesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.salesService.findOne(id, req.user.tenantId);
  }

  @Post(':id/return')
  returnSale(@Param('id') id: string, @Body() createSaleReturnDto: CreateSaleReturnDto, @Request() req) {
    return this.salesService.returnSale(
      id,
      req.user.tenantId,
      req.user.userId,
      createSaleReturnDto.items,
      createSaleReturnDto.reason,
    );
  }
}
