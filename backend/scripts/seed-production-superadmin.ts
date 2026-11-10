import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Script de inicialización seguro para Producción (eTshop).
 * 
 * Cumple estrictamente con:
 * 1. Inicializar ÚNICAMENTE el usuario SuperAdmin con las credenciales de QA.
 * 2. Cero creación de empresas, comercios, categorías, productos, inventario o ventas de prueba.
 * 3. Idempotente y seguro: se puede ejecutar en el deploy inicial o subsecuentes sin duplicar datos.
 */
async function seedProductionSuperadmin() {
  console.log('=====================================================');
  console.log('🚀 eTshop - Inicialización de SuperAdmin en Producción');
  console.log('=====================================================');

  const defaultUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const defaultEmail = process.env.SUPERADMIN_EMAIL || 'admin@etshop.com';
  const defaultPhone = process.env.SUPERADMIN_PHONE || '1143225890';
  const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'eTshop2026!';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Buscar si ya existe un SuperAdmin registrado
  let superadmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: Role.SUPERADMIN },
        { username: defaultUsername },
        { email: defaultEmail },
        { phone: defaultPhone },
      ],
    },
  });

  if (superadmin) {
    console.log(`ℹ️ Usuario SuperAdmin ya existente detectado (ID: ${superadmin.id}). Sincronizando credenciales...`);
    superadmin = await prisma.user.update({
      where: { id: superadmin.id },
      data: {
        username: defaultUsername,
        name: 'SuperAdmin eTshop',
        email: defaultEmail,
        phone: defaultPhone,
        passwordHash,
        role: Role.SUPERADMIN,
        isActive: true,
        companyId: null, // NUNCA ligado a comercios de prueba
        roleProfileId: null,
      },
    });
    console.log('✅ Credenciales de SuperAdmin sincronizadas exitosamente.');
  } else {
    console.log('🌱 Creando nuevo usuario SuperAdmin por defecto...');
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
        companyId: null, // Sin compañía inicial
        roleProfileId: null,
      },
    });
    console.log('✅ Usuario SuperAdmin creado exitosamente.');
  }

  // 2. Verificar catálogo de módulos del sistema (catálogo global requerido por la plataforma)
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
  console.log('✅ Catálogo base de módulos del sistema verificado.');

  // 3. Verificación de aislamiento e integridad: Asegurar estado 100% limpio
  const totalCompanies = await prisma.company.count();
  const totalProducts = await prisma.product.count();
  const totalSales = await prisma.sale.count();

  console.log('-----------------------------------------------------');
  console.log('🛡️ Estado de la base de datos de Producción:');
  console.log(`   - Empresas / Comercios registrados: ${totalCompanies}`);
  console.log(`   - Productos en catálogo:            ${totalProducts}`);
  console.log(`   - Ventas registradas:               ${totalSales}`);
  console.log('-----------------------------------------------------');

  if (totalCompanies === 0) {
    console.log('✨ Entorno de producción limpio: listo para crear el primer comercio desde cero.');
  }

  console.log('');
  console.log('🔑 Credenciales de Acceso SuperAdmin (QA & Producción):');
  console.log(`   - Usuario / Username:   ${superadmin.username}`);
  console.log(`   - Teléfono / Celular:   ${superadmin.phone}`);
  console.log(`   - Correo electrónico:  ${superadmin.email}`);
  console.log(`   - Contraseña de acceso: ${defaultPassword}`);
  console.log(`   - Rol de plataforma:    ${superadmin.role}`);
  console.log('=====================================================');
}

seedProductionSuperadmin()
  .catch((error) => {
    console.error('❌ Error ejecutando seed de SuperAdmin en producción:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

