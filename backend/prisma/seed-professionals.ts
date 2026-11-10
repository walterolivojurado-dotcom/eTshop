import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst();
  if (!business) {
    console.error('❌ Debes crear un negocio primero (o loguearte para que se cree uno).');
    return;
  }

  const professionalsData = [
    { name: 'María Sánchez', email: 'maria@calenbaq.com' },
    { name: 'Paula Ortiz', email: 'paula@calenbaq.com' },
  ];

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('CalenBaq2026!', salt);

  for (const data of professionalsData) {
    // 1. Crear Usuario con rol PROFESSIONAL
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        passwordHash: password,
        role: Role.PROFESSIONAL,
      },
    });

    // 2. Crear Perfil Profesional vinculado al negocio
    const professional = await prisma.professional.upsert({
      where: { userId: user.id },
      update: { businessId: business.id },
      create: {
        userId: user.id,
        businessId: business.id,
      },
    });

    // 3. Crear Horario Base (Lunes a Viernes 08:00 - 18:00)
    for (let i = 1; i <= 5; i++) {
        await prisma.availabilitySchedule.upsert({
            where: {
                professionalId_dayOfWeek: {
                    professionalId: professional.id,
                    dayOfWeek: i
                }
            },
            update: {
                startTime: '08:00',
                endTime: '18:00',
                isActive: true
            },
            create: {
                professionalId: professional.id,
                dayOfWeek: i,
                startTime: '08:00',
                endTime: '18:00'
            }
        });
    }
  }

  console.log('✅ Profesionales "María" y "Paula" insertados con éxito con sus horarios.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
