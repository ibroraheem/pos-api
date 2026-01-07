import { PrismaClient, Role, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Super Admin Tenant (System Tenant)
    const systemTenant = await prisma.tenant.upsert({
        where: { email: 'admin@pos.com' },
        update: {},
        create: {
            name: 'System Tenant',
            email: 'admin@pos.com',
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            vatEnabled: false,
        },
    });

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@pos.com' },
        update: { password: hashedPassword, role: Role.SUPER_ADMIN },
        create: {
            email: 'admin@pos.com',
            password: hashedPassword,
            role: Role.SUPER_ADMIN,
            tenantId: systemTenant.id,
        },
    });

    console.log({ superAdmin });

    // 2. Create Demo Tenant
    const demoTenant = await prisma.tenant.upsert({
        where: { email: 'tenant@pos.com' },
        update: {},
        create: {
            name: 'Demo Pharmacy',
            email: 'tenant@pos.com',
            subscriptionStatus: SubscriptionStatus.TRIAL,
            vatEnabled: true,
        },
    });

    const tenantAdmin = await prisma.user.upsert({
        where: { email: 'tenant@pos.com' },
        update: { password: hashedPassword, role: Role.TENANT_ADMIN },
        create: {
            email: 'tenant@pos.com',
            password: hashedPassword,
            role: Role.TENANT_ADMIN,
            tenantId: demoTenant.id,
        },
    });

    console.log({ tenantAdmin });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
