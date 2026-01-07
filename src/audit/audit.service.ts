import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) { }

  async logAction(
    userId: string,
    tenantId: string,
    action: string,
    details: any,
    ipAddress?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        tenantId,
        action,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress,
      },
    });
  }

  // Admin: View logs
  async findAll(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
