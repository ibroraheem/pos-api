import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenantId) {
            return true; // Let AuthGuard handle missing user
        }

        // Check if method is Read-Only
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            return true;
        }

        // Check Tenant Status from DB (source of truth)
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { subscriptionStatus: true },
        });

        if (!tenant) return false;

        if (tenant.subscriptionStatus === SubscriptionStatus.EXPIRED) {
            throw new ForbiddenException('Subscription Expired. Read-Only access only.');
        }

        return true;
    }
}
