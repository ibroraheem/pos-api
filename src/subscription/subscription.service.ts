import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) { }

  async handleWebhook(payload: any) {
    // Basic Mock Implementation for PaymentPoint.co
    // Assuming payload has { email: string, status: 'success' }

    if (payload.status !== 'success') {
      return { message: 'Payment ignored' };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { email: payload.email },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found for email: ' + payload.email);
    }

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });

    return { message: 'Subscription activated' };
  }

  // Placeholder for other CRUD if needed
  findAll() { return 'This action returns all subscription'; }
  findOne(id: number) { return `This action returns a #${id} subscription`; }
}
