import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Obteniendo negocio principal...');
  let business = await prisma.business.findFirst();
  
  if (!business) {
    console.log('No se encontró negocio, creando uno de prueba...');
    // Create admin user first if it doesn't exist
    let admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (!admin) {
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('CalenBaqQA!', salt);
        admin = await prisma.user.create({
            data: {
                email: 'admin_qa@calenbaq.com',
                name: 'Admin QA',
                passwordHash: password,
                role: Role.ADMIN
            }
        });
    }

    business = await prisma.business.create({
        data: {
            name: 'CalenBaq QA Staging',
            slug: 'qa-staging',
            ownerId: admin.id
        }
    });
  }

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('TestQA123!', salt);

  console.log('Creando 5 Profesionales de prueba...');
  const profNames = ['Ana QA', 'Beto QA', 'Carlos QA', 'Diana QA', 'Elena QA'];
  
  for (let i = 0; i < profNames.length; i++) {
    const email = `prof${i+1}_qa@calenbaq.com`;
    let user = await prisma.user.findFirst({ where: { email, businessId: business.id } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: profNames[i],
                passwordHash: password,
                role: Role.PROFESSIONAL,
                businessId: business.id
            }
        });
    }

    let prof = await prisma.professional.findUnique({ where: { userId: user.id } });
    if (!prof) {
        prof = await prisma.professional.create({
            data: {
                userId: user.id,
                businessId: business.id,
                bio: `Profesional de QA ${i+1}`
            }
        });
    }
  }

  console.log('Creando 5 Servicios de prueba...');
  const serviceNames = ['Corte Básico QA', 'Colorimetría QA', 'Manicura QA', 'Pedicura QA', 'Masaje Relajante QA'];
  for (let i = 0; i < serviceNames.length; i++) {
    const name = serviceNames[i];
    let service = await prisma.service.findFirst({ where: { name, businessId: business.id } });
    if (!service) {
        await prisma.service.create({
            data: {
                name,
                businessId: business.id,
                durationMinutes: 30 + (i * 15),
                price: 15.00 + (i * 5),
                isActive: true
            }
        });
    }
  }

  console.log('QA Seed completado exitosamente con 5 Profesionales y 5 Servicios.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
