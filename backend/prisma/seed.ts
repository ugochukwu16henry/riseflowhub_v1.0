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

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const email = `test-${role}@example.com`;
    const name = `Test ${role.replace('_', ' ')}`;

    await prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash },
      create: {
        email,
        name,
        passwordHash,
        role,
      },
    });
    console.log(`Seeded user: ${email} (${role})`);
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
