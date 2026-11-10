import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed de producción para eTshop...');

  const defaultUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const defaultEmail = process.env.SUPERADMIN_EMAIL || 'admin@etshop.com';
  const defaultPhone = process.env.SUPERADMIN_PHONE || '1143225890';
  const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'eTshop2026!';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Buscar o inicializar SuperAdmin
  let superadmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: Role.SUPERADMIN },
        { username: defaultUsername },
      ],
    },
  });

  if (superadmin) {
    console.log(`ℹ️ SuperAdmin existente detectado: ${superadmin.username}. Actualizando credenciales...`);
    await prisma.user.update({
      where: { id: superadmin.id },
      data: {
        username: defaultUsername,
        name: 'SuperAdmin eTshop',
        email: defaultEmail,
        phone: defaultPhone,
        passwordHash,
        role: Role.SUPERADMIN,
        isActive: true,
        companyId: null,
      },
    });
  } else {
    console.log('🌱 Creando usuario SuperAdmin por defecto...');
    superadmin = await prisma.user.create({
      data: {
        name: 'SuperAdmin eTshop',
        username: defaultUsername,
        email: defaultEmail,
        phone: defaultPhone,
        phoneCode: '+57',
        passwordHash,
        role: Role.SUPERADMIN,
        isActive: true,
        companyId: null,
      },
    });
  }

  // 2. Módulos base requeridos por el sistema
  const systemModules = [
    { code: 'pos', name: 'Punto de Venta (POS / Caja)', description: 'Terminal de caja para registrar ventas rápidas.', icon: 'ShoppingCart', isCore: true, sortOrder: 1 },
    { code: 'inventario', name: 'Gestión de Inventario y Stock', description: 'Control de existencias, kardex y alertas.', icon: 'Package', isCore: true, sortOrder: 2 },
    { code: 'categorias', name: 'Categorías de Productos', description: 'Familias de productos para el POS.', icon: 'Tags', isCore: false, sortOrder: 3 },
    { code: 'ventas', name: 'Historial y Arqueo de Ventas', description: 'Registro de transacciones y cierres.', icon: 'Receipt', isCore: true, sortOrder: 4 },
    { code: 'usuarios', name: 'Usuarios y Cajeros', description: 'Gestión de personal por comercio.', icon: 'Users', isCore: false, sortOrder: 5 },
    { code: 'modulos', name: 'Roles, Módulos y Permisos', description: 'Perfiles de acceso y permisos granulares.', icon: 'ShieldCheck', isCore: false, sortOrder: 6 },
    { code: 'analitica', name: 'Analítica y Reportes BI', description: 'Reportes ejecutivos y ventas.', icon: 'BarChart2', isCore: false, sortOrder: 7 },
    { code: 'configuracion', name: 'Configuración del Comercio', description: 'Datos fiscales, logo e impuestos.', icon: 'Settings', isCore: true, sortOrder: 8 },
  ];

  for (const mod of systemModules) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: { name: mod.name, description: mod.description, icon: mod.icon, isCore: mod.isCore, sortOrder: mod.sortOrder },
      create: mod,
    });
  }

  console.log('✅ Inicialización completada exitosamente.');
  console.log('🛡️ Producción inicia completamente limpia: 0 comercios, 0 inventario.');
  console.log('🔑 Credenciales:');
  console.log(`   - Username: ${defaultUsername}`);
  console.log(`   - Celular:  ${defaultPhone}`);
  console.log(`   - Password: ${defaultPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
