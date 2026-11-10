import 'dotenv/config';
import bcrypt from 'bcryptjs';
import app from './app';
import config from './config';
import logger from './lib/logger';
import prisma from './lib/prisma';

const PORT = config.port || 4000;

export async function seedInitialPlatformData() {
  await prisma.$connect();
  logger.info('✅ Conectado a Supabase PostgreSQL (eTshop)');

  const salt = await bcrypt.genSalt(10);
  const superPassHash = await bcrypt.hash('eTshop2026!', salt);

  // 1. Crear o asegurar SuperAdmin con username alfanumérico libre
  let superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' },
  });

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        name: 'SuperAdmin eTshop',
        username: 'superadmin',
        email: 'admin@etshop.com',
        phone: '1143225890',
        passwordHash: superPassHash,
        role: 'SUPERADMIN',
        isActive: true,
      },
    });
    logger.info('✅ SuperAdmin creado: username="superadmin" / pass="eTshop2026!"');
  }

  // 2. Crear comercio demo si aún no hay ninguno
  const demoSlug = 'miscelanea-central';
  let demoCompany = await prisma.company.findUnique({
    where: { slug: demoSlug },
  });

  if (!demoCompany) {
    const adminPassHash = await bcrypt.hash('admin1234', salt);
    const cashierPassHash = await bcrypt.hash('caja1234', salt);

    const demoOwner = await prisma.user.create({
      data: {
        name: 'Carlos Mendoza (Administrador)',
        username: 'admin.central',
        email: 'carlos@miscelaneacentral.com',
        phone: '3001234567',
        passwordHash: adminPassHash,
        role: 'ADMIN',
        isActive: true,
      },
    });

    demoCompany = await prisma.company.create({
      data: {
        name: 'Miscelánea & Supermercado Central',
        slug: demoSlug,
        nit: '901.452.890-1',
        address: 'Calle 72 # 43-25, Local 102',
        phone: '3001234567',
        email: 'ventas@miscelaneacentral.com',
        companyName: 'Miscelánea Central',
        ownerId: demoOwner.id,
        isActive: true,
        maxUsers: 10,
        activeModules: [
          'pos',
          'inventario',
          'categorias',
          'ventas',
          'usuarios',
          'modulos',
          'configuracion',
          'analitica',
        ],
      },
    });

    await prisma.user.update({
      where: { id: demoOwner.id },
      data: { companyId: demoCompany.id },
    });

    // Sincronizar módulos en company_modules
    const allModules = await prisma.module.findMany();
    for (const mod of allModules) {
      await prisma.companyModule.upsert({
        where: {
          companyId_moduleId: {
            companyId: demoCompany.id,
            moduleId: mod.id,
          },
        },
        update: { isEnabled: true },
        create: {
          companyId: demoCompany.id,
          moduleId: mod.id,
          isEnabled: true,
        },
      });
    }

    // Crear perfiles de rol y cajero de prueba con identificador alfanumérico con guion
    const cashierRole = await prisma.roleProfile.create({
      data: {
        companyId: demoCompany.id,
        name: 'Cajero Punto de Venta',
        modules: ['pos', 'ventas'],
        isGlobalViewEnabled: false,
      },
    });

    await prisma.roleProfile.create({
      data: {
        companyId: demoCompany.id,
        name: 'Auxiliar de Bodega e Inventario',
        modules: ['inventario', 'categorias'],
        isGlobalViewEnabled: true,
      },
    });

    await prisma.user.create({
      data: {
        companyId: demoCompany.id,
        name: 'Laura Gómez (Cajera Turno 1)',
        username: 'CAJA-01',
        phone: 'CAJA-01',
        passwordHash: cashierPassHash,
        role: 'CASHIER',
        roleProfileId: cashierRole.id,
        isActive: true,
      },
    });

    // Categorías demo
    const catBebidas = await prisma.category.create({
      data: {
        companyId: demoCompany.id,
        name: 'Bebidas y Refrescos',
        description: 'Gaseosas, jugos, aguas y energizantes',
        color: '#0ea5e9',
        icon: 'CupSoda',
      },
    });

    const catAbarrotes = await prisma.category.create({
      data: {
        companyId: demoCompany.id,
        name: 'Abarrotes y Granos',
        description: 'Arroz, aceite, azúcar, café y despensa',
        color: '#f59e0b',
        icon: 'Package',
      },
    });

    const catSnacks = await prisma.category.create({
      data: {
        companyId: demoCompany.id,
        name: 'Mecato y Papelería',
        description: 'Snacks, dulces, cuadernos y útiles de miscelánea',
        color: '#ec4899',
        icon: 'Sparkles',
      },
    });

    const catAseo = await prisma.category.create({
      data: {
        companyId: demoCompany.id,
        name: 'Aseo y Hogar',
        description: 'Detergentes, jabones y cuidado personal',
        color: '#10b981',
        icon: 'ShieldCheck',
      },
    });

    // Productos demo
    await prisma.product.createMany({
      data: [
        {
          companyId: demoCompany.id,
          categoryId: catBebidas.id,
          name: 'Coca-Cola Original 1.5L',
          sku: 'BEB-001',
          barcode: '7702535001018',
          costPrice: 4200,
          salePrice: 6000,
          stock: 35,
          minStock: 8,
          unit: 'UND',
        },
        {
          companyId: demoCompany.id,
          categoryId: catBebidas.id,
          name: 'Agua Cristal Sin Gas 600ml',
          sku: 'BEB-002',
          barcode: '7702535001025',
          costPrice: 1100,
          salePrice: 2200,
          stock: 48,
          minStock: 12,
          unit: 'UND',
        },
        {
          companyId: demoCompany.id,
          categoryId: catAbarrotes.id,
          name: 'Arroz Diana Premium 1Kg',
          sku: 'ABA-001',
          barcode: '7702001002013',
          costPrice: 3600,
          salePrice: 4800,
          stock: 50,
          minStock: 10,
          unit: 'KG',
        },
        {
          companyId: demoCompany.id,
          categoryId: catAbarrotes.id,
          name: 'Aceite Gourmet 1000ml',
          sku: 'ABA-002',
          barcode: '7702001002099',
          costPrice: 9500,
          salePrice: 12800,
          stock: 4, // Stock bajo para probar alerta visual
          minStock: 6,
          unit: 'UND',
        },
        {
          companyId: demoCompany.id,
          categoryId: catAbarrotes.id,
          name: 'Café Sello Rojo 500g',
          sku: 'ABA-003',
          barcode: '7702001003050',
          costPrice: 11200,
          salePrice: 14900,
          stock: 22,
          minStock: 5,
          unit: 'UND',
        },
        {
          companyId: demoCompany.id,
          categoryId: catSnacks.id,
          name: 'Papas Margarita Pollo Grande',
          sku: 'SNK-001',
          barcode: '7702189003019',
          costPrice: 3800,
          salePrice: 5500,
          stock: 28,
          minStock: 6,
          unit: 'PAQ',
        },
        {
          companyId: demoCompany.id,
          categoryId: catSnacks.id,
          name: 'Cuaderno Cosido 100 Hojas Cuadriculado',
          sku: 'PAP-001',
          barcode: '7703004005012',
          costPrice: 3200,
          salePrice: 5800,
          stock: 3, // Stock bajo
          minStock: 5,
          unit: 'UND',
        },
        {
          companyId: demoCompany.id,
          categoryId: catAseo.id,
          name: 'Detergente Líquido Ariel 1L',
          sku: 'ASE-001',
          barcode: '7704005006011',
          costPrice: 10500,
          salePrice: 14500,
          stock: 15,
          minStock: 4,
          unit: 'UND',
        },
      ],
    });

    logger.info('✅ Comercio Demo "Miscelánea Central" e inventario inicial creados.');
  }
}

async function bootstrap(): Promise<void> {
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 eTshop API corriendo en http://0.0.0.0:${PORT}`);
    logger.info(`🩺 Health: http://0.0.0.0:${PORT}/api/health`);
  });

  seedInitialPlatformData().catch((err) => {
    logger.error('❌ Error inicializando datos semilla de eTshop:', err);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`\n⚠️ Señal ${signal} recibida. Cerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  bootstrap();
}
