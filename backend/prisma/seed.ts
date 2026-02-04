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

  // FAQ items (homepage + /faq)
  try {
    const faqCount = await prisma.faqItem.count();
    if (faqCount === 0) {
      await prisma.faqItem.createMany({
        data: [
          {
            question: 'What is this platform about?',
            answer:
              'AfriLaunch Hub is a venture-building platform that helps entrepreneurs turn ideas into real startups through technology, AI guidance, business structuring, and access to investors.',
            category: 'general',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'Who is this platform for?',
            answer:
              'It is built for founders with ideas, early-stage startups that need structure, and investors looking for vetted opportunities across Africa and beyond.',
            category: 'general',
            order: 2,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'What do I get when I join as a founder?',
            answer:
              'You get idea evaluation, business model creation, website/app development, an AI startup mentor, business administration tools, and investor visibility once you are ready.',
            category: 'founders',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'I only have an idea, can I join?',
            answer:
              'Yes. The platform is designed to help you move from idea stage to a structured, launched business. You do not need a finished product before joining.',
            category: 'founders',
            order: 2,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'What is the process from idea to startup?',
            answer:
              'You submit your idea → our AI and team evaluate it → we help you shape a business model → development and branding begin → your product is launched on the platform → you get support for growth and investor access.',
            category: 'process',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'How are startups vetted for investors?',
            answer:
              'We combine AI-based scoring, human business analysis, and structured evaluation of traction, team, market, and product readiness before presenting startups to investors.',
            category: 'investors',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'How do I invest through the platform?',
            answer:
              'You browse approved startups, request access to their deal room, review documents and metrics, then express interest, request a meeting, or make an offer through the investment workflow.',
            category: 'investors',
            order: 2,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'Why is there a setup fee?',
            answer:
              'The setup fee covers evaluation, business structuring, onboarding, and initial resources needed to support your project before launch.',
            category: 'pricing',
            order: 1,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'Is my idea safe on this platform?',
            answer:
              'Yes. We use NDAs, role-based access control, and secure storage. Only relevant team members and approved investors can see sensitive startup information.',
            category: 'security',
            order: 1,
            isActive: true,
            isHighlighted: false,
          },
          {
            question: 'What makes this platform different?',
            answer:
              'AfriLaunch Hub combines product development, business intelligence, AI mentorship, and investor access in one system, with a focus on African founders and practical execution.',
            category: 'benefits',
            order: 1,
            isActive: true,
            isHighlighted: true,
          },
          {
            question: 'What is the long-term goal of the platform?',
            answer:
              'Our vision is to build a global ecosystem where great ideas are not lost due to lack of structure, technology, or funding — starting from Africa and expanding outward.',
            category: 'vision',
            order: 1,
            isActive: true,
            isHighlighted: false,
          },
        ],
      });
      console.log('Seeded initial FAQ items');
    } else {
      console.log('FAQ items already present, skipping');
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') {
      console.log('Skipping FAQ seeding (table not found). Run: pnpm run db:push');
    } else {
      throw e;
    }
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
