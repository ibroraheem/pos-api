import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  create(createProductDto: CreateProductDto, tenantId: string) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        tenantId,
        expiryDate: createProductDto.expiryDate ? new Date(createProductDto.expiryDate) : null,
      },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
    });
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product || product.tenantId !== tenantId) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, tenantId: string) {
    // Verify ownership
    await this.findOne(id, tenantId);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        expiryDate: updateProductDto.expiryDate ? new Date(updateProductDto.expiryDate) : undefined,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    // Verify ownership
    await this.findOne(id, tenantId);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
