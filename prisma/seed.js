import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('Start seeding...');

  // IMPORTANT: Use environment variables for sensitive data!
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = 'Admin';

  if (!adminEmail || !adminPassword) {
    throw new Error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // Don't update if exists
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: 'ADMIN', // Assign the ADMIN role
      emailVerified: true,
    },
  });

  console.log(`Admin user ${adminUser.email} created/confirmed.`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
