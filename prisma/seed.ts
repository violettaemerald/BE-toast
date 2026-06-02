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

  const categories = [
  { name: 'Makanan', sortOrder: 1 },
  { name: 'Minuman', sortOrder: 2 },
  { name: 'Dessert', sortOrder: 3 },
  { name: 'Snack',   sortOrder: 4 },
  { name: 'Paket',   sortOrder: 5 },
  { name: 'Lainnya', sortOrder: 6 },
]

for (const cat of categories) {
  await prisma.category.upsert({
    where:  { id: cat.sortOrder },
    update: {},
    create: cat,
  })
}

  console.log('Admin seeded!');
  console.log('Menu seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());