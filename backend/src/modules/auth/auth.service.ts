import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt';
import { createError } from '../../middlewares/error.middleware';
import { RegisterDto, LoginDto } from './auth.schemas';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_DAYS = 7;

const refreshTokenExpiry = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_DAYS);
  return date;
};

const safeUserFields = {
  id: true,
  username: true,
  name: true,
  email: true,
  role: true,
  phone: true,
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
      isActive: true,
      isGlobalViewEnabled: true,
    },
  },
  company: {
    select: {
      id: true,
      slug: true,
      name: true,
      nit: true,
      address: true,
      phone: true,
      currency: true,
      logoUrl: true,
      activeModules: true,
      settings: true,
    },
  },
} as const;

export function formatUserResponse(user: any) {
  if (!user) return null;
  return {
    ...user,
    businessId: user.companyId,
    business: user.company,
    isGlobalViewEnabled:
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      (user.roleProfile?.isGlobalViewEnabled ?? true),
  };
}

export class AuthService {
  /**
   * Registra una nueva empresa (Tenant) y su usuario Administrador dueño.
   * Soporta cualquier formato de texto libre en `username`.
   */
  async register(dto: RegisterDto) {
    const rawUsername = (dto.username || dto.phone || '').trim();
    const targetName = (dto.companyName || dto.businessName || '').trim();
    const targetSlug = (dto.companySlug || dto.businessSlug || '')
      .trim()
      .toLowerCase();

    if (!rawUsername) {
      throw createError('El identificador de usuario (username) es obligatorio', 400);
    }
    if (!targetName || !targetSlug) {
      throw createError('El nombre y el slug de la empresa son obligatorios', 400);
    }

    const existingCompany = await prisma.company.findUnique({
      where: { slug: targetSlug },
    });

    if (existingCompany) {
      throw createError('El identificador (slug) de empresa ya está en uso', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const defaultModules = dto.activeModules && dto.activeModules.length > 0
      ? dto.activeModules
      : ['pos', 'inventario', 'categorias', 'ventas', 'usuarios', 'modulos', 'configuracion', 'analitica'];

    return prisma.$transaction(async (tx) => {
      // 1. Crear el usuario administrador inicialmente
      const user = await tx.user.create({
        data: {
          name: dto.name.trim(),
          username: rawUsername,
          phone: dto.phone?.trim() || rawUsername,
          email: dto.email ? dto.email.trim().toLowerCase() : null,
          passwordHash,
          role: Role.ADMIN,
        },
      });

      // 2. Crear la empresa (Tenant) vinculada al owner
      const company = await tx.company.create({
        data: {
          name: targetName,
          slug: targetSlug,
          nit: dto.nit || null,
          address: dto.address || null,
          phone: dto.phone || null,
          email: dto.email || null,
          ownerId: user.id,
          activeModules: defaultModules,
        },
      });

      // 3. Vincular módulos en la tabla relacional `company_modules`
      const allModules = await tx.module.findMany();
      if (allModules.length > 0) {
        await tx.companyModule.createMany({
          data: allModules.map((mod) => ({
            companyId: company.id,
            moduleId: mod.id,
            isEnabled: defaultModules.includes(mod.code),
          })),
          skipDuplicates: true,
        });
      }

      // 4. Crear perfiles de rol predeterminados para la empresa (Cajero e Inventario)
      const cashierProfile = await tx.roleProfile.create({
        data: {
          name: 'Cajero POS',
          modules: ['pos', 'ventas'],
          isGlobalViewEnabled: false,
          companyId: company.id,
        },
      });

      await tx.roleProfile.create({
        data: {
          name: 'Jefe de Inventario',
          modules: ['inventario', 'categorias', 'analitica'],
          isGlobalViewEnabled: true,
          companyId: company.id,
        },
      });

      // 5. Crear categorías base de ejemplo para el comercio
      const catBebidas = await tx.category.create({
        data: {
          companyId: company.id,
          name: 'Bebidas y Lácteos',
          description: 'Refrescos, aguas, jugos y productos lácteos',
          color: '#0ea5e9',
          icon: 'CupSoda',
        },
      });

      const catAbarrotes = await tx.category.create({
        data: {
          companyId: company.id,
          name: 'Abarrotes y Despensa',
          description: 'Granos, aceites, pastas y enlatados',
          color: '#f59e0b',
          icon: 'Package',
        },
      });

      const catSnacks = await tx.category.create({
        data: {
          companyId: company.id,
          name: 'Snacks y Dulcería',
          description: 'Mecato, galletas, chocolates y confitería',
          color: '#ec4899',
          icon: 'Cookie',
        },
      });

      // 6. Crear productos iniciales de demostración con stock
      await tx.product.createMany({
        data: [
          {
            companyId: company.id,
            categoryId: catBebidas.id,
            name: 'Gaseosa Coca-Cola 1.5L',
            sku: 'BEB-001',
            barcode: '7702535001018',
            costPrice: 4200,
            salePrice: 6000,
            stock: 24,
            minStock: 6,
            unit: 'UND',
          },
          {
            companyId: company.id,
            categoryId: catAbarrotes.id,
            name: 'Arroz Diana Premium 1Kg',
            sku: 'ABA-001',
            barcode: '7702001002013',
            costPrice: 3600,
            salePrice: 4800,
            stock: 40,
            minStock: 10,
            unit: 'KG',
          },
          {
            companyId: company.id,
            categoryId: catSnacks.id,
            name: 'Papas Margarita Pollo 150g',
            sku: 'SNK-001',
            barcode: '7702189003019',
            costPrice: 3800,
            salePrice: 5500,
            stock: 18,
            minStock: 5,
            unit: 'PAQ',
          },
        ],
      });

      // 7. Actualizar el usuario con su companyId
      const sessionId = crypto.randomUUID();
      const refreshToken = generateRefreshToken(user.id);
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          currentSessionId: sessionId,
          refreshToken,
          refreshTokenExp: refreshTokenExpiry(),
        },
        select: safeUserFields,
      });

      const accessToken = generateAccessToken({
        userId: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        companyId: company.id,
        businessId: company.id,
        sessionId,
        isGlobalViewEnabled: true,
      });

      return {
        user: formatUserResponse(updatedUser),
        accessToken,
        refreshToken,
        cashierProfileId: cashierProfile.id,
      };
    });
  }

  /**
   * Inicia sesión con cualquier cadena de texto (`username`, `identifier` o `phone`)
   * sin restricción numérica ni de longitud.
   */
  async login(dto: LoginDto) {
    const rawIdentifier = (dto.username || dto.identifier || dto.phone || '').trim();
    const targetSlug = (dto.companySlug || dto.businessSlug || '').trim().toLowerCase() || null;

    if (!rawIdentifier) {
      throw createError('El usuario o identificador es requerido', 400);
    }

    let user: any = null;

    if (targetSlug) {
      const company = await prisma.company.findUnique({ where: { slug: targetSlug } });
      if (!company) {
        throw createError('El comercio especificado no existe', 404);
      }

      // Buscar primero en el comercio actual por username, email o phone
      user = await prisma.user.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { username: { equals: rawIdentifier, mode: 'insensitive' } },
            { phone: rawIdentifier },
            { email: { equals: rawIdentifier, mode: 'insensitive' } },
          ],
        },
        include: {
          company: true,
          roleProfile: true,
        },
      });

      // Si no se encuentra en la empresa, permitir ingreso si es SUPERADMIN
      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            role: Role.SUPERADMIN,
            OR: [
              { username: { equals: rawIdentifier, mode: 'insensitive' } },
              { phone: rawIdentifier },
              { email: { equals: rawIdentifier, mode: 'insensitive' } },
            ],
          },
          include: {
            company: true,
            roleProfile: true,
          },
        });
      }
    } else {
      // Login global: priorizar SUPERADMIN o coincidencia exacta de username/email/phone
      const candidates = await prisma.user.findMany({
        where: {
          OR: [
            { username: { equals: rawIdentifier, mode: 'insensitive' } },
            { phone: rawIdentifier },
            { email: { equals: rawIdentifier, mode: 'insensitive' } },
          ],
        },
        include: {
          company: true,
          roleProfile: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      user =
        candidates.find((u) => u.role === Role.SUPERADMIN) ||
        candidates.find((u) => u.role === Role.ADMIN) ||
        candidates[0] ||
        null;
    }

    if (!user) {
      throw createError('Credenciales inválidas. Verifica tu usuario y contraseña.', 401);
    }

    if (!user.isActive) {
      throw createError(`Tu usuario (${user.username}) se encuentra desactivado.`, 403);
    }

    if (user.company && !user.company.isActive && user.role !== Role.SUPERADMIN) {
      throw createError('La cuenta de esta empresa se encuentra suspendida o inactiva.', 403);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Credenciales inválidas. Verifica tu usuario y contraseña.', 401);
    }

    const sessionId = crypto.randomUUID();
    const refreshToken = generateRefreshToken(user.id);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockUntil: null,
        currentSessionId: sessionId,
        refreshToken,
        refreshTokenExp: refreshTokenExpiry(),
      },
      select: safeUserFields,
    });

    const isGlobalViewEnabled =
      updatedUser.role === Role.SUPERADMIN ||
      updatedUser.role === Role.ADMIN ||
      (updatedUser.roleProfile?.isGlobalViewEnabled ?? true);

    const accessToken = generateAccessToken({
      userId: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      companyId: updatedUser.companyId,
      businessId: updatedUser.companyId,
      sessionId,
      isGlobalViewEnabled,
    });

    return {
      user: formatUserResponse(updatedUser),
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        ...safeUserFields,
        refreshToken: true,
        refreshTokenExp: true,
        currentSessionId: true,
      },
    });

    if (!user || !user.isActive || user.refreshToken !== token) {
      throw createError('Sesión inválida o expirada', 401);
    }

    if (user.refreshTokenExp && user.refreshTokenExp < new Date()) {
      throw createError('Refresh token expirado', 401);
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      companyId: user.companyId,
      businessId: user.companyId,
      sessionId: user.currentSessionId || undefined,
      isGlobalViewEnabled:
        user.role === Role.SUPERADMIN ||
        user.role === Role.ADMIN ||
        (user.roleProfile?.isGlobalViewEnabled ?? true),
    });

    return { accessToken };
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExp: null,
        currentSessionId: null,
      },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: safeUserFields,
    });

    if (!user) {
      throw createError('Usuario no encontrado', 404);
    }

    return formatUserResponse(user);
  }

  async updateProfile(userId: string, data: { name?: string; username?: string; phone?: string; email?: string; avatarUrl?: string }) {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) throw createError('Usuario no encontrado', 404);

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.phone !== undefined) updateData.phone = data.phone.trim();

    if (data.username !== undefined && data.username.trim() !== currentUser.username) {
      const cleanUsername = data.username.trim();
      const duplicate = await prisma.user.findFirst({
        where: {
          username: { equals: cleanUsername, mode: 'insensitive' },
          companyId: currentUser.companyId,
          id: { not: userId },
        },
      });
      if (duplicate) {
        throw createError('Ese identificador de usuario ya está en uso en esta empresa', 409);
      }
      updateData.username = cleanUsername;
    }

    if (data.email !== undefined) {
      updateData.email = data.email ? data.email.trim().toLowerCase() : null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: safeUserFields,
    });

    return formatUserResponse(updated);
  }

  async updatePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError('Usuario no encontrado', 404);

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw createError('La contraseña actual es incorrecta', 400);
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return true;
  }

  async migrateClients() {
    return { total: 0, migrated: 0, errors: [] };
  }
}

export const authService = new AuthService();
