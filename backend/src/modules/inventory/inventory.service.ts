import prisma from '../../lib/prisma';
import { createError } from '../../middlewares/error.middleware';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  AdjustStockDto,
} from './inventory.schemas';
import { StockMovementType } from '@prisma/client';

export class InventoryService {
  // ─── CATEGORÍAS ───────────────────────────────────────────────────────────

  async listCategories(companyId: string, includeInactive: boolean = false) {
    return prisma.category.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(companyId: string, dto: CreateCategoryDto) {
    const existing = await prisma.category.findFirst({
      where: {
        companyId,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
    });

    if (existing) {
      throw createError('Ya existe una categoría con ese nombre en tu empresa', 409);
    }

    return prisma.category.create({
      data: {
        companyId,
        name: dto.name.trim(),
        description: dto.description || null,
        color: dto.color || '#10b981',
        icon: dto.icon || 'Tag',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(companyId: string, id: string, dto: UpdateCategoryDto) {
    const category = await prisma.category.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw createError('Categoría no encontrada', 404);
    }

    if (dto.isActive === false && (category._count?.products || 0) > 0) {
      throw createError(
        'No se puede inactivar una categoría que tiene productos asociados',
        400
      );
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteCategory(companyId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw createError('Categoría no encontrada', 404);
    }

    if ((category._count?.products || 0) > 0) {
      throw createError(
        'No se puede inactivar una categoría que tiene productos asociados',
        400
      );
    }

    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── PRODUCTOS / INVENTARIO ───────────────────────────────────────────────

  async listProducts(
    companyId: string,
    filters?: {
      search?: string;
      categoryId?: string;
      lowStockOnly?: boolean;
      includeInactive?: boolean;
    }
  ) {
    const where: any = {
      companyId,
      ...(filters?.includeInactive ? {} : { isActive: true }),
    };

    if (filters?.categoryId && filters.categoryId !== 'ALL') {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = products.map((p) => ({
      ...p,
      costPrice: Number(p.costPrice),
      salePrice: Number(p.salePrice),
      taxRate: Number(p.taxRate),
      stock: Number(p.stock),
      minStock: Number(p.minStock),
      isLowStock: Number(p.stock) <= Number(p.minStock),
    }));

    if (filters?.lowStockOnly) {
      return formatted.filter((p) => p.isLowStock);
    }

    return formatted;
  }

  async createProduct(companyId: string, userId: string, dto: CreateProductDto) {
    return prisma.$transaction(async (tx) => {
      const initialStock = Number(dto.stock || 0);

      const product = await tx.product.create({
        data: {
          companyId,
          categoryId: dto.categoryId || null,
          name: dto.name.trim(),
          description: dto.description || null,
          sku: dto.sku ? dto.sku.trim() : null,
          barcode: dto.barcode ? dto.barcode.trim() : null,
          costPrice: dto.costPrice ?? 0,
          salePrice: dto.salePrice ?? 0,
          taxRate: dto.taxRate ?? 0,
          stock: initialStock,
          minStock: dto.minStock ?? 5,
          unit: dto.unit || 'UND',
          imageUrl: dto.imageUrl || null,
          isActive: dto.isActive ?? true,
        },
        include: {
          category: true,
        },
      });

      if (initialStock !== 0) {
        await tx.stockMovement.create({
          data: {
            companyId,
            productId: product.id,
            userId,
            type: StockMovementType.INITIAL,
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            notes: 'Inventario inicial al crear el producto',
          },
        });
      }

      return {
        ...product,
        costPrice: Number(product.costPrice),
        salePrice: Number(product.salePrice),
        stock: Number(product.stock),
        minStock: Number(product.minStock),
      };
    });
  }

  async updateProduct(companyId: string, userId: string, id: string, dto: UpdateProductDto) {
    const existing = await prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw createError('Producto no encontrado en esta empresa', 404);
    }

    return prisma.$transaction(async (tx) => {
      const prevStock = Number(existing.stock);
      const nextStock = dto.stock !== undefined ? Number(dto.stock) : prevStock;

      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || null }),
          ...(dto.sku !== undefined && { sku: dto.sku ? dto.sku.trim() : null }),
          ...(dto.barcode !== undefined && { barcode: dto.barcode ? dto.barcode.trim() : null }),
          ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
          ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
          ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
          ...(dto.stock !== undefined && { stock: nextStock }),
          ...(dto.minStock !== undefined && { minStock: dto.minStock }),
          ...(dto.unit !== undefined && { unit: dto.unit }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
        include: {
          category: true,
        },
      });

      if (dto.stock !== undefined && nextStock !== prevStock) {
        const diff = nextStock - prevStock;
        await tx.stockMovement.create({
          data: {
            companyId,
            productId: id,
            userId,
            type: StockMovementType.ADJUSTMENT,
            quantity: diff,
            previousStock: prevStock,
            newStock: nextStock,
            notes: 'Ajuste directo en edición de producto',
          },
        });
      }

      return {
        ...updated,
        costPrice: Number(updated.costPrice),
        salePrice: Number(updated.salePrice),
        stock: Number(updated.stock),
        minStock: Number(updated.minStock),
      };
    });
  }

  /**
   * Ajuste de existencias (Entrada de mercancía, Merma/Ajuste, Devolución) con registro en Kardex
   */
  async adjustStock(companyId: string, userId: string, productId: string, dto: AdjustStockDto) {
    const product = await prisma.product.findFirst({
      where: { id: productId, companyId },
    });

    if (!product) {
      throw createError('Producto no encontrado en esta empresa', 404);
    }

    const prevStock = Number(product.stock);
    const delta = Number(dto.quantity);
    const newStock = prevStock + delta;

    if (newStock < 0) {
      throw createError(`El stock resultante no puede ser negativo (${newStock})`, 400);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
        include: { category: true },
      });

      const movement = await tx.stockMovement.create({
        data: {
          companyId,
          productId,
          userId,
          type: dto.type as StockMovementType,
          quantity: delta,
          previousStock: prevStock,
          newStock,
          notes: dto.notes || `Ajuste de inventario (${dto.type})`,
        },
      });

      return {
        product: {
          ...updated,
          costPrice: Number(updated.costPrice),
          salePrice: Number(updated.salePrice),
          stock: Number(updated.stock),
          minStock: Number(updated.minStock),
        },
        movement,
      };
    });
  }

  async getStockMovements(companyId: string, productId?: string, limit: number = 50) {
    const movements = await prisma.stockMovement.findMany({
      where: {
        companyId,
        ...(productId ? { productId } : {}),
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, unit: true },
        },
        user: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return movements.map((m) => ({
      ...m,
      quantity: Number(m.quantity),
      previousStock: Number(m.previousStock),
      newStock: Number(m.newStock),
    }));
  }

  async deleteProduct(companyId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!product) {
      throw createError('Producto no encontrado', 404);
    }

    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const inventoryService = new InventoryService();

