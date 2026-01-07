import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('cashier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TENANT_ADMIN)
  createCashier(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.createCashier(createUserDto, req.user.tenantId);
  }
}
