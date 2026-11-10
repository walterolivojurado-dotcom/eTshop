import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@calenbaq.com';
  // Password: CalenBaq2026!
  const passwordHash = '$2b$10$Y2tz6rpRO2.HYNzk9ukWfOAr/Ad9/v6UM6OT8xWiO4G9Nz41fIFKq';
  
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        passwordHash,
      },
      create: {
        email,
        name: 'Admin CalenBaq',
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log('Admin user reset successfully:', user.email);
  } catch (error) {
    console.error('Error resetting admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
