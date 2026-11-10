import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de producción...');

  // 1. Check if SUPERADMIN already exists
  const existing = await prisma.user.findFirst({ where: { role: Role.SUPERADMIN } });
  if (existing) {
    console.log('✅ SUPERADMIN ya existe:', existing.email);
    
    // Check if platform business exists
    const biz = await prisma.business.findUnique({ where: { slug: 'calenbaq' } });
    if (!biz) {
      await prisma.business.create({
        data: {
          slug: 'calenbaq',
          name: 'CalenBaq Pro',
          companyName: 'CalenBaq Pro',
          ownerId: existing.id,
          isActive: true,
          settings: { theme: 'beutsmile' },
        }
      });
      console.log('✅ Negocio de plataforma (calenbaq) creado.');
    } else {
      console.log('✅ Negocio de plataforma ya existe:', biz.slug);
    }
    return;
  }

  // 2. Create SUPERADMIN
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('CalenBaq2026!', salt);

  const superadmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@calenbaq.com',
      phone: '3000000000',
      passwordHash,
      role: Role.SUPERADMIN,
      isActive: true,
    }
  });
  console.log('✅ SUPERADMIN creado:', superadmin.email);

  // 3. Create platform business
  await prisma.business.create({
    data: {
      slug: 'calenbaq',
      name: 'CalenBaq Pro',
      companyName: 'CalenBaq Pro',
      ownerId: superadmin.id,
      isActive: true,
      settings: { theme: 'beutsmile' },
    }
  });
  console.log('✅ Negocio de plataforma (calenbaq) creado.');
  console.log('');
  console.log('🎉 Seed completado. Credenciales de acceso:');
  console.log('   Email:    admin@calenbaq.com');
  console.log('   Password: CalenBaq2026!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
