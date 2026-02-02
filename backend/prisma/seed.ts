import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Password123';

const roles = [
  'super_admin',
  'client',
  'developer',
  'designer',
  'marketer',
  'project_manager',
  'finance_admin',
  'investor',
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: 'default' },
    update: {},
    create: {
      orgName: 'AfriLaunch Hub',
      domain: 'default',
      primaryColor: '#6366f1',
      planType: 'enterprise',
    },
  });
  console.log('Seeded default tenant:', defaultTenant.orgName);

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const email = `test-${role}@example.com`;
    const name = `Test ${role.replace('_', ' ')}`;

    await prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash, tenantId: defaultTenant.id },
      create: {
        email,
        name,
        passwordHash,
        role,
        tenantId: defaultTenant.id,
      },
    });
    console.log(`Seeded user: ${email} (${role})`);
  }

  const superAdminPassword = '1995Mobuchi@.';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  await prisma.user.upsert({
    where: { email: 'ugochukwuhenry16@gmail.com' },
    update: { name: 'Super Admin', role: 'super_admin', passwordHash: superAdminHash, tenantId: defaultTenant.id },
    create: {
      email: 'ugochukwuhenry16@gmail.com',
      name: 'Super Admin',
      passwordHash: superAdminHash,
      role: 'super_admin',
      tenantId: defaultTenant.id,
    },
  });
  console.log('Seeded Super Admin: ugochukwuhenry16@gmail.com');

  console.log('\nSeed complete. Test users (password for all):', TEST_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
