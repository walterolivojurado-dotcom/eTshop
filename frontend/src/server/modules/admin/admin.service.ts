import prisma from '../../lib/prisma';
import { createError } from '../../middlewares/error.middleware';

export class AdminService {
  /**
   * Lista todas las empresas (comercios/tenants) en el Centro de Control Global de eTshop
   */
  async getAllBusinesses() {
    const companies = await prisma.company.findMany({
      where: {
        slug: { notIn: ['etshop', 'calenbaq'] },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        companyModules: {
          include: {
            module: true,
          },
        },
        _count: {
          select: {
            products: true,
            sales: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((c) => ({
      ...c,
      maxProfessionals: c.maxUsers, // Alias de compatibilidad UI
    }));
  }

  /**
   * Activa o desactiva una empresa (Tenant)
   */
  async updateBusinessStatus(id: string, isActive: boolean) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw createError('Comercio no encontrado', 404);

    return prisma.company.update({
      where: { id },
      data: {
        isActive,
        subscriptionStatus: isActive ? 'ACTIVE' : 'SUSPENDED',
      },
    });
  }

  /**
   * Actualiza la suscripción, cupo de usuarios y módulos activos de una empresa
   * Sincroniza tanto `companies.active_modules` como la tabla relacional `company_modules`.
   */
  async updateBusinessSubscription(
    id: string,
    maxUsersOrProf: number,
    activeModules: string[],
    planName?: string
  ) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw createError('Comercio no encontrado', 404);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.company.update({
        where: { id },
        data: {
          maxUsers: Number(maxUsersOrProf) || 5,
          activeModules,
          ...(planName ? { planName } : {}),
        },
      });

      const allModules = await tx.module.findMany();
      for (const mod of allModules) {
        const isEnabled = activeModules.includes(mod.code);
        await tx.companyModule.upsert({
          where: {
            companyId_moduleId: {
              companyId: id,
              moduleId: mod.id,
            },
          },
          update: { isEnabled },
          create: {
            companyId: id,
            moduleId: mod.id,
            isEnabled,
          },
        });
      }

      return updated;
    });
  }

  /**
   * Lista el catálogo global de módulos de eTshop
   */
  async getCatalogModules() {
    return prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Lista todos los usuarios registrados en la plataforma
   */
  async getAllUsers() {
    const users = await prisma.user.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        roleProfile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      business: u.company,
    }));
  }
}

export const adminService = new AdminService();
