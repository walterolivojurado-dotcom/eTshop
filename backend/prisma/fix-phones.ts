import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Actualizando teléfonos en Staging...');
  
  // Update Superadmin
  await prisma.user.updateMany({
    where: { role: 'SUPERADMIN' },
    data: { phone: '3000000000' }
  });
  console.log('✅ Superadmin: 3000000000');

  // Update Professionals
  const profs = await prisma.user.findMany({
    where: { role: 'PROFESSIONAL' },
    orderBy: { createdAt: 'asc' }
  });

  for (let i = 0; i < profs.length; i++) {
    const phone = `300000000${i + 1}`;
    await prisma.user.update({
      where: { id: profs[i].id },
      data: { phone }
    });
    console.log(`✅ ${profs[i].name}: ${phone}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
