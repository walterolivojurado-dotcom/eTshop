import prisma from '../../lib/prisma';
import { createError } from '../../middlewares/error.middleware';
import { CreateBusinessDto, UpdateBusinessDto } from './business.schemas';
import { Role } from '@prisma/client';

const generateSlug = async (name: string): Promise<string> => {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = base || 'comercio';
  let counter = 1;

  while (await prisma.company.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
};

export class BusinessService {
  async create(ownerId: string, dto: CreateBusinessDto) {
    const slug = await generateSlug(dto.name);

    return prisma.company.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        nit: dto.nit,
        address: dto.address,
        phone: dto.phone,
        email: dto.email || null,
        currency: dto.currency ?? 'COP',
        timezone: dto.timezone ?? 'America/Bogota',
        logoUrl: dto.logoUrl,
        ownerId,
      },
    });
  }

  async getMyBusinesses(userId: string, userRole?: string) {
    const where: any = {};

    if (userRole === Role.SUPERADMIN) {
      // SuperAdmin ve todas las empresas
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (user?.companyId) {
        where.id = user.companyId;
      } else {
        where.ownerId = userId;
      }
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        companyModules: {
          include: { module: true },
        },
        _count: {
          select: { products: true, sales: true, users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return companies;
  }

  async getBySlug(slug: string) {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true, username: true } },
        companyModules: {
          include: { module: true },
        },
        categories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!company) {
      throw createError('Comercio no encontrado', 404);
    }

    return company;
  }

  async update(companyId: string, userId: string, userRole: string, dto: UpdateBusinessDto) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company) {
      throw createError('Comercio no encontrado', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, role: true },
    });

    const isCompanyAdmin = user?.companyId === companyId && user?.role === Role.ADMIN;

    if (userRole !== Role.SUPERADMIN && company.ownerId !== userId && !isCompanyAdmin) {
      throw createError('No tienes permisos para modificar este comercio', 403);
    }

    return prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.nit !== undefined && { nit: dto.nit }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.settings !== undefined && { settings: dto.settings as any }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.activeModules !== undefined && { activeModules: dto.activeModules }),
      },
    });
  }

  async verifyOwnership(companyId: string, userId: string, userRole?: string): Promise<void> {
    if (userRole === Role.SUPERADMIN) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (user?.companyId === companyId) return;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company || company.ownerId !== userId) {
      throw createError('No tienes permisos sobre este comercio', 403);
    }
  }
}

export const businessService = new BusinessService();
