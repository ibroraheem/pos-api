import { ForbiddenException, Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async createCashier(createUserDto: CreateUserDto, tenantId: string) {
    // 1. Check Cashier Limit
    const cashierCount = await this.prisma.user.count({
      where: {
        tenantId,
        role: Role.CASHIER,
      },
    });

    if (cashierCount >= 5) {
      throw new ForbiddenException('Cashier limit reached. You can only create up to 5 cashiers.');
    }

    // 2. Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    // 3. Hash Password & Create
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        tenantId,
        role: Role.CASHIER,
      },
    });
  }

  // Basic CRUD placeholders
  findAll() { return `This action returns all users`; }
  findOne(id: number) { return `This action returns a #${id} user`; }
  update(id: number, updateUserDto: UpdateUserDto) { return `This action updates a #${id} user`; }
  remove(id: number) { return `This action removes a #${id} user`; }
}
