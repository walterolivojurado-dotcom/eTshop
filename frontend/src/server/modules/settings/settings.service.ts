import prisma from '../../lib/prisma';
import { createError } from '../../middlewares/error.middleware';

export class SettingsService {
  private async ensurePlatformCompany() {
    let platform = await prisma.company.findUnique({
      where: { slug: 'etshop' },
      select: {
        id: true,
        name: true,
        slug: true,
        companyName: true,
        logoUrl: true,
        faviconUrl: true,
        settings: true,
        isActive: true,
      },
    });

    if (!platform) {
      const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPERADMIN' },
      });

      platform = await prisma.company.create({
        data: {
          name: 'eTshop Plataforma Global',
          slug: 'etshop',
          companyName: 'eTshop',
          ownerId: superAdmin?.id || null,
          isActive: true,
          settings: { theme: 'default' },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          companyName: true,
          logoUrl: true,
          faviconUrl: true,
          settings: true,
          isActive: true,
        },
      });
    }

    return platform;
  }

  async getPublicSettings(identifier: string | string[]) {
    const rawId = Array.isArray(identifier)
      ? identifier[identifier.length - 1]
      : identifier;
    const cleanId = String(rawId || 'etshop').trim().toLowerCase();

    if (cleanId === 'etshop' || cleanId === 'calenbaq' || cleanId === 'platform') {
      return this.ensurePlatformCompany();
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    const company = await prisma.company.findFirst({
      where: isUuid ? { id: cleanId } : { slug: cleanId },
      select: {
        id: true,
        name: true,
        slug: true,
        companyName: true,
        logoUrl: true,
        faviconUrl: true,
        settings: true,
        isActive: true,
      },
    });

    if (!company) {
      return this.ensurePlatformCompany();
    }

    // Heredar logo/favicon de la plataforma central si el comercio no tiene o para referencia global
    const platform = await this.ensurePlatformCompany();
    return {
      ...company,
      logoUrl: company.logoUrl || platform.logoUrl,
      faviconUrl: company.faviconUrl || platform.faviconUrl,
      platformLogoUrl: platform.logoUrl,
      platformFaviconUrl: platform.faviconUrl,
      platformCompanyName: platform.companyName || 'eTshop',
    };
  }

  async updateBranding(
    companyId: string,
    ownerId: string,
    userRole: string,
    data: { companyName?: string; logoUrl?: string; faviconUrl?: string; theme?: string },
    userCompanyId?: string
  ) {
    const isSuperAdmin = String(userRole).toUpperCase().includes('SUPERADMIN');

    let targetId = companyId;
    if (companyId === 'platform' || companyId === 'etshop' || companyId === 'calenbaq') {
      const platform = await this.ensurePlatformCompany();
      targetId = platform.id;
    }

    const existingCompany = await prisma.company.findUnique({
      where: { id: targetId },
    });

    if (!existingCompany) {
      throw createError(`Comercio no encontrado (ID: ${targetId})`, 404);
    }

    // Si es la entidad central ('etshop'), SOLO el SUPERADMIN puede modificar su logo/identidad
    if (existingCompany.slug === 'etshop' && !isSuperAdmin) {
      throw createError('Solo el SuperAdmin puede modificar el logo global inmutable de eTshop', 403);
    }

    if (!isSuperAdmin) {
      const isOwner = existingCompany.ownerId === ownerId;
      const belongsToCompany = !!userCompanyId && userCompanyId === targetId;
      if (!isOwner && !belongsToCompany) {
        throw createError('No tienes permisos para actualizar este comercio', 403);
      }
    }

    const updateData: any = {};
    if (data.companyName !== undefined) updateData.companyName = data.companyName || null;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null;
    if (data.faviconUrl !== undefined) updateData.faviconUrl = data.faviconUrl || null;

    if (data.theme !== undefined) {
      const currentSettings = (existingCompany.settings as any) || {};
      updateData.settings = {
        ...currentSettings,
        theme: data.theme,
      };
    }

    return prisma.company.update({
      where: { id: targetId },
      data: updateData,
    });
  }

  async getPaymentConfig(_companyId: string) {
    return null;
  }

  async updatePaymentConfig(_companyId: string, data: any) {
    return data;
  }
}

export const settingsService = new SettingsService();
