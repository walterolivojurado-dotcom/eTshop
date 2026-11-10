import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import { createError } from '../../middlewares/error.middleware';
import { CreateStaffDto, UpdateStaffDto } from './staff.schemas';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

export class StaffService {
  async listByCompany(companyId: string, includeInactive: boolean = true) {
    return prisma.user.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        companyId: true,
        roleProfileId: true,
        createdAt: true,
        roleProfile: {
          select: {
            id: true,
            name: true,
            modules: true,
            isGlobalViewEnabled: true,
          },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createStaff(companyId: string, dto: CreateStaffDto) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!company) {
      throw createError('Empresa no encontrada', 404);
    }

    if (company._count.users >= company.maxUsers) {
      throw createError(
        `Has alcanzado el límite de usuarios (${company.maxUsers}) permitidos en tu plan.`,
        403
      );
    }

    const cleanUsername = dto.username.trim();
    const existing = await prisma.user.findFirst({
      where: {
        companyId,
        username: { equals: cleanUsername, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw createError(`El identificador "${cleanUsername}" ya está registrado en esta empresa.`, 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return prisma.user.create({
      data: {
        companyId,
        name: dto.name.trim(),
        username: cleanUsername,
        phone: dto.phone?.trim() || null,
        email: dto.email ? dto.email.trim().toLowerCase() : null,
        passwordHash,
        role: (dto.role as Role) || Role.CASHIER,
        roleProfileId: dto.roleProfileId || null,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        companyId: true,
        roleProfileId: true,
        roleProfile: true,
        createdAt: true,
      },
    });
  }

  async updateStaff(companyId: string, userId: string, dto: UpdateStaffDto) {
    const existing = await prisma.user.findFirst({
      where: { id: userId, companyId },
    });

    if (!existing) {
      throw createError('Usuario no encontrado en esta empresa', 404);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) updateData.email = dto.email ? dto.email.trim().toLowerCase() : null;
    if (dto.role !== undefined) updateData.role = dto.role as Role;
    if (dto.roleProfileId !== undefined) updateData.roleProfileId = dto.roleProfileId || null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.username !== undefined && dto.username.trim() !== existing.username) {
      const cleanUsername = dto.username.trim();
      const duplicate = await prisma.user.findFirst({
        where: {
          companyId,
          username: { equals: cleanUsername, mode: 'insensitive' },
          id: { not: userId },
        },
      });
      if (duplicate) {
        throw createError(`El identificador "${cleanUsername}" ya está en uso en esta empresa.`, 409);
      }
      updateData.username = cleanUsername;
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        companyId: true,
        roleProfileId: true,
        roleProfile: true,
        createdAt: true,
      },
    });
  }
}

export const staffService = new StaffService();

