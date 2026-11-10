import prisma from '../../lib/prisma';
import { createError } from '../../middlewares/error.middleware';
import { CreateSaleDto, CancelSaleDto } from './sales.schemas';
import { PaymentMethod, SaleStatus } from '@prisma/client';

export class SalesService {
  /**
   * Registra una nueva venta en el POS y sus items (`sale_items`).
   * El descuento de inventario y registro en Kardex se ejecuta automáticamente
   * en PostgreSQL mediante el trigger `trg_deduct_stock_after_sale_item`.
   */
  async createSale(companyId: string, userId: string, dto: CreateSaleDto) {
    const productIds = dto.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        companyId,
        id: { in: productIds },
      },
    });

    if (dbProducts.length !== new Set(productIds).size) {
      throw createError('Uno o más productos no existen o no pertenecen a esta empresa', 400);
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    let taxAmount = 0;

    const preparedItems = dto.items.map((item) => {
      const prod = productMap.get(item.productId)!;
      const qty = Number(item.quantity);
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : Number(prod.salePrice);
      const unitCost = Number(prod.costPrice);
      const itemDiscount = Number(item.discount || 0);
      const lineTotal = Math.max(0, qty * unitPrice - itemDiscount);
      const taxRate = Number(prod.taxRate || 0);
      const lineTax = taxRate > 0 ? lineTotal * (taxRate / 100) : 0;

      subtotal += lineTotal;
      taxAmount += lineTax;

      return {
        companyId,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku || prod.barcode || null,
        quantity: qty,
        unitPrice,
        unitCost,
        discount: itemDiscount,
        subtotal: lineTotal,
      };
    });

    const globalDiscount = Number(dto.discountAmount || 0);
    const total = Math.max(0, subtotal + taxAmount - globalDiscount);
    const amountReceived = dto.amountReceived !== undefined && dto.amountReceived > 0
      ? Number(dto.amountReceived)
      : total;

    if (dto.paymentMethod === 'CASH' && amountReceived < total) {
      throw createError(
        `El monto recibido ($${amountReceived.toLocaleString()}) es menor al total a pagar ($${total.toLocaleString()})`,
        400
      );
    }

    const changeAmount = Math.max(0, amountReceived - total);

    return prisma.$transaction(async (tx) => {
      // Generar consecutivo de factura/ticket por empresa
      const count = await tx.sale.count({ where: { companyId } });
      const saleNumber = `POS-${String(count + 1).padStart(5, '0')}`;

      const sale = await tx.sale.create({
        data: {
          companyId,
          saleNumber,
          userId,
          customerName: dto.customerName?.trim() || null,
          customerDoc: dto.customerDoc?.trim() || null,
          customerPhone: dto.customerPhone?.trim() || null,
          subtotal,
          taxAmount,
          discountAmount: globalDiscount,
          total,
          paymentMethod: dto.paymentMethod as PaymentMethod,
          amountReceived,
          changeAmount,
          status: SaleStatus.COMPLETED,
          notes: dto.notes || null,
        },
      });

      // Insertar cada item (dispara el trigger de PostgreSQL `trg_deduct_stock_after_sale_item`)
      for (const item of preparedItems) {
        await tx.saleItem.create({
          data: {
            ...item,
            saleId: sale.id,
          },
        });
      }

      const fullSale = await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          user: {
            select: { id: true, name: true, username: true },
          },
          items: true,
        },
      });

      return this.formatSale(fullSale);
    });
  }

  async listSales(
    companyId: string,
    filters?: {
      status?: string;
      paymentMethod?: string;
      search?: string;
      limit?: number;
    }
  ) {
    const where: any = { companyId };

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { saleNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerDoc: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });

    return sales.map((s) => this.formatSale(s));
  }

  async getSaleById(companyId: string, id: string) {
    const sale = await prisma.sale.findFirst({
      where: { id, companyId },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
        items: true,
      },
    });

    if (!sale) {
      throw createError('Venta no encontrada', 404);
    }

    return this.formatSale(sale);
  }

  /**
   * Anula o reembolsa una venta.
   * El trigger `trg_restore_stock_on_sale_cancel` en PostgreSQL restaura el stock automáticamente.
   */
  async cancelSale(companyId: string, id: string, dto: CancelSaleDto) {
    const sale = await prisma.sale.findFirst({
      where: { id, companyId },
    });

    if (!sale) {
      throw createError('Venta no encontrada', 404);
    }

    if (sale.status !== SaleStatus.COMPLETED) {
      throw createError('Esta venta ya fue anulada o reembolsada anteriormente', 400);
    }

    const updated = await prisma.sale.update({
      where: { id },
      data: {
        status: (dto.status as SaleStatus) || SaleStatus.CANCELLED,
        notes: dto.reason
          ? `${sale.notes ? sale.notes + ' | ' : ''}Anulada: ${dto.reason}`
          : sale.notes,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
        items: true,
      },
    });

    return this.formatSale(updated);
  }

  private formatSale(sale: any) {
    if (!sale) return null;
    return {
      ...sale,
      subtotal: Number(sale.subtotal),
      taxAmount: Number(sale.taxAmount),
      discountAmount: Number(sale.discountAmount),
      total: Number(sale.total),
      amountReceived: Number(sale.amountReceived),
      changeAmount: Number(sale.changeAmount),
      items: (sale.items || []).map((i: any) => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        unitCost: Number(i.unitCost),
        discount: Number(i.discount),
        subtotal: Number(i.subtotal),
      })),
    };
  }
}

export const salesService = new SalesService();

