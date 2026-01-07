import { Controller, Get, Patch, Param, Body, UseGuards, ParseEnumPipe, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, SubscriptionStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('tenants')
  findAllTenants() {
    return this.adminService.findAllTenants();
  }

  @Get('pricing')
  getPricing() {
    return this.adminService.getPricing();
  }

  @Post('pricing')
  updatePricing(@Body() newPricing: any) {
    return this.adminService.updatePricing(newPricing);
  }

  @Patch('tenants/:id/subscription')
  toggleSubscription(
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(SubscriptionStatus)) status: SubscriptionStatus,
  ) {
    return this.adminService.toggleSubscription(id, status);
  }
}
