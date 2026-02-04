import 'dotenv/config';
// Prefer .env.local if present (e.g. Supabase DATABASE_URL)
require('dotenv').config({ path: '.env.local', override: true });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fillAgreementTemplate } from '../src/templates/agreementTemplates';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Password123';

const SKILLS: { name: string; category: string }[] = [
  { name: 'Frontend Developer', category: 'Tech' },
  { name: 'Backend Developer', category: 'Tech' },
  { name: 'Full Stack Developer', category: 'Tech' },
  { name: 'Mobile Developer', category: 'Tech' },
  { name: 'DevOps Engineer', category: 'Tech' },
  { name: 'AI Engineer', category: 'Tech' },
  { name: 'Data Analyst', category: 'Tech' },
  { name: 'UI/UX Designer', category: 'Creative' },
  { name: 'Graphic Designer', category: 'Creative' },
  { name: 'Video Editor', category: 'Creative' },
  { name: 'Project Manager', category: 'Business' },
  { name: 'Marketing Specialist', category: 'Business' },
  { name: 'HR Manager', category: 'Business' },
];

const roles = [
  'super_admin',
  'client',
  'developer',
  'designer',
  'marketer',
  'project_manager',
  'finance_admin',
  'investor',
  'talent',
  'hirer',
  'hiring_company',
  'hr_manager',
  'legal_team',
  'cofounder',
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
    // Hiring / Talent Marketplace — editable in CMS (Super Admin)
    { key: 'hiring.roleCategories', value: JSON.stringify(['Tech Roles', 'Creative Roles', 'Business Roles']), type: 'json', page: 'hiring' },
    { key: 'hiring.skillList', value: JSON.stringify(['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer', 'DevOps Engineer', 'AI Engineer', 'Data Analyst', 'Cybersecurity', 'UI/UX Designer', 'Graphic Designer', 'Video Editor', 'Animator', 'Project Manager', 'HR Manager', 'Recruiter', 'Marketing Specialist', 'Social Media Manager']), type: 'json', page: 'hiring' },
    { key: 'hiring.talentFeeUsd', value: '7', type: 'text', page: 'hiring' },
    { key: 'hiring.companyFeeUsd', value: '20', type: 'text', page: 'hiring' },
  ];
  for (const entry of cmsEntries) {
    await prisma.cmsContent.upsert({
      where: { key: entry.key },
      update: { value: entry.value, type: entry.type, page: entry.page },
      create: { ...entry, updatedById: null },
    });
  }
  console.log(`Seeded ${cmsEntries.length} CMS content entries`);

  // Skills (for talent marketplace & hiring) — only if none exist
  const skillCount = await prisma.skill.count();
  if (skillCount === 0) {
    await prisma.skill.createMany({ data: SKILLS });
    console.log(`Seeded ${SKILLS.length} skills`);
  } else {
    console.log('Skills already present, skipping');
  }

  // Agreement templates (for Legal / Admin to assign) — requires DB to have Agreement columns (content_html, status, etc.). Run db:push if needed.
  const agreementCount = await prisma.agreement.count();
  if (agreementCount === 0) {
    const superAdminUser = await prisma.user.findFirst({ where: { role: 'super_admin' }, select: { id: true } });
    const createdById = superAdminUser?.id ?? null;
    const date = new Date().toISOString().slice(0, 10);

    const agreementTemplates: { title: string; type: 'NDA' | 'MOU' | 'Terms' | 'FairTreatment' | 'HireContract' }[] = [
      { title: 'Standard NDA', type: 'NDA' },
      { title: 'Memorandum of Understanding', type: 'MOU' },
      { title: 'Platform Terms', type: 'Terms' },
      { title: 'Fair Treatment Agreement', type: 'FairTreatment' },
      { title: 'Contractor Agreement', type: 'HireContract' },
    ];
    try {
      for (const t of agreementTemplates) {
        const contentHtml = fillAgreementTemplate(t.type, { date, partyName: '________________', companyName: 'AfriLaunch Hub', role: '________________' });
        await prisma.agreement.create({
          data: { title: t.title, type: t.type, contentHtml, createdById, status: 'Pending', version: 1 },
        });
      }
      console.log(`Seeded ${agreementTemplates.length} agreement templates`);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2022') {
        console.log('Skipping agreement templates (DB missing new Agreement columns). Run: pnpm run db:push');
      } else {
        throw e;
      }
    }
  } else {
    console.log('Agreements already present, skipping');
  }

  // Sample notifications (so the bell has something to show)
  try {
    const clientUser = await prisma.user.findFirst({ where: { email: 'test-client@example.com' }, select: { id: true } });
    if (clientUser) {
      const existingNotif = await prisma.notification.count({ where: { userId: clientUser.id } });
      if (existingNotif === 0) {
        await prisma.notification.createMany({
          data: [
            { userId: clientUser.id, type: 'agreement', title: 'Welcome to AfriLaunch Hub', message: 'Complete your profile and explore the dashboard.', link: '/dashboard', read: false },
            { userId: clientUser.id, type: 'payment', title: 'Setup fee', message: 'Pay the one-time setup fee to unlock your workspace.', link: '/dashboard', read: false },
          ],
        });
        console.log('Seeded 2 sample notifications for test-client');
      }
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') {
      console.log('Skipping notifications (table not found). Run: pnpm run db:push');
    } else {
      throw e;
    }
  }

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
