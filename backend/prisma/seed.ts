import 'dotenv/config';
// Prefer .env.local if present (e.g. Supabase DATABASE_URL)
require('dotenv').config({ path: '.env.local', override: true });

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

  // CMS: default content (Super Admin can edit via CMS Manager)
  const cmsEntries: Array<{ key: string; value: string; type: string; page: string }> = [
    { key: 'home.hero.title', value: 'Turn Ideas Into Real Startups', type: 'text', page: 'home' },
    { key: 'home.hero.subtitle', value: 'From Idea to Impact — Build your venture with expert support.', type: 'text', page: 'home' },
    { key: 'home.cta.label', value: 'Get Started', type: 'text', page: 'home' },
    { key: 'pricing.setupFee', value: 'One-time setup fee to unlock your workspace.', type: 'text', page: 'pricing' },
    { key: 'pricing.investorFee', value: 'Investor onboarding fee for deal room access.', type: 'text', page: 'pricing' },
    { key: 'email.welcome.subject', value: 'Welcome to AfriLaunch Hub', type: 'text', page: 'email' },
    { key: 'legal.terms', value: 'Terms of Service content — edit in CMS Manager.', type: 'richtext', page: 'legal' },
    { key: 'legal.privacy', value: 'Privacy Policy content — edit in CMS Manager.', type: 'richtext', page: 'legal' },
  ];
  for (const entry of cmsEntries) {
    await prisma.cmsContent.upsert({
      where: { key: entry.key },
      update: { value: entry.value, type: entry.type, page: entry.page },
      create: { ...entry, updatedById: null },
    });
  }
  console.log(`Seeded ${cmsEntries.length} CMS content entries`);

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
