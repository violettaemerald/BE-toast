// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where:  { email: 'admin@esb.com' },
    update: { password: hashed }, 
    create: {
      name:     'Super Admin',
      email:    'admin@esb.com',
      password: 'admin123',
      role:     'admin',
    },
  });

  console.log('Admin seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());