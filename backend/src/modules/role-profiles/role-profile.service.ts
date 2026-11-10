import prisma from '../../lib/prisma';
import { createError } from '../../middlewares/error.middleware';
import { CreateRoleProfileDto, UpdateRoleProfileDto } from './role-profile.schemas';

export class RoleProfileService {
  async create(payload: CreateRoleProfileDto) {
    const companyId = payload.companyId || payload.businessId;
    if (!companyId) {
      throw createError('El identificador de la empresa (companyId) es requerido', 400);
    }

    return prisma.roleProfile.create({
      data: {
        name: payload.name,
        modules: payload.modules,
        isGlobalViewEnabled: payload.isGlobalViewEnabled ?? true,
        companyId,
      },
    });
  }

  async listByBusiness(companyId: string, includeInactive: boolean = false) {
    return prisma.roleProfile.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(companyId: string, id: string, dto: UpdateRoleProfileDto) {
    const profile = await prisma.roleProfile.findFirst({
      where: { id, companyId },
    });

    if (!profile) {
      throw createError('Perfil de rol no encontrado en esta empresa', 404);
    }

    return prisma.roleProfile.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.modules !== undefined && { modules: dto.modules }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isGlobalViewEnabled !== undefined && { isGlobalViewEnabled: dto.isGlobalViewEnabled }),
      },
    });
  }

  async deactivate(companyId: string, id: string) {
    const profile = await prisma.roleProfile.findFirst({
      where: { id, companyId },
    });

    if (!profile) {
      throw createError('Perfil de rol no encontrado en esta empresa', 404);
    }

    return prisma.roleProfile.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Obtiene los módulos asignados a una empresa (company_modules + modules)
   */
  async getCompanyModules(companyId: string) {
    const allModules = await prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        companyModules: true,
      },
    });

    if (!company) {
      throw createError('Empresa no encontrada', 404);
    }

    return allModules.map((mod) => {
      const rel = company.companyModules.find((cm) => cm.moduleId === mod.id);
      const isEnabled = rel ? rel.isEnabled : company.activeModules.includes(mod.code);
      return {
        ...mod,
        isEnabled,
        config: rel?.config ?? {},
      };
    });
  }

  /**
   * Activa o desactiva un módulo específico dentro de la empresa
   */
  async toggleCompanyModule(companyId: string, moduleCode: string, isEnabled: boolean) {
    const mod = await prisma.module.findUnique({ where: { code: moduleCode } });
    if (!mod) {
      throw createError('Módulo no encontrado en el catálogo', 404);
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw createError('Empresa no encontrada', 404);
    }

    return prisma.$transaction(async (tx) => {
      await tx.companyModule.upsert({
        where: {
          companyId_moduleId: {
            companyId,
            moduleId: mod.id,
          },
        },
        update: { isEnabled },
        create: {
          companyId,
          moduleId: mod.id,
          isEnabled,
        },
      });

      const currentActive = new Set(company.activeModules || []);
      if (isEnabled) {
        currentActive.add(moduleCode);
      } else {
        currentActive.delete(moduleCode);
      }

      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: {
          activeModules: Array.from(currentActive),
        },
      });

      return updatedCompany;
    });
  }
}

export const roleProfileService = new RoleProfileService();
