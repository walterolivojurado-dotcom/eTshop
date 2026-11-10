import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Sincronizando Superadmin en Staging...');
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('CalenBaq2026!', salt);

  // 1. Find or Create Superadmin with the EXACT phone number
  const phone = '1143225890';
  
  let superadmin = await prisma.user.findFirst({
    where: { OR: [{ phone }, { role: 'SUPERADMIN' }] }
  });

  if (superadmin) {
    await prisma.user.update({
      where: { id: superadmin.id },
      data: {
        phone,
        passwordHash,
        role: 'SUPERADMIN',
        isActive: true
      }
    });
    console.log(`✅ Superadmin actualizado: Celular ${phone}, Password CalenBaq2026!`);
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin QA',
        email: 'superadmin_qa@calenbaq.com',
        phone,
        passwordHash,
        role: 'SUPERADMIN',
        isActive: true
      }
    });
    console.log(`✅ Superadmin creado: Celular ${phone}, Password CalenBaq2026!`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
