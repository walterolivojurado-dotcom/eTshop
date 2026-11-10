import prisma from '../../lib/prisma';
import { SaleStatus } from '@prisma/client';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  categoryId?: string;
}

export class AnalyticsService {
  private getBaseWhere(companyId: string, filters: AnalyticsFilters) {
    const { startDate, endDate, userId } = filters;

    return {
      companyId,
      status: SaleStatus.COMPLETED,
      ...(userId ? { userId } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };
  }

  async getDashboardKPIs(companyId: string, filters: AnalyticsFilters = {}) {
    const where = this.getBaseWhere(companyId, filters);

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: true,
      },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalSales = sales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    let totalCost = 0;
    let totalUnitsSold = 0;
    for (const s of sales) {
      for (const item of s.items) {
        totalCost += Number(item.unitCost || 0) * Number(item.quantity || 0);
        totalUnitsSold += Number(item.quantity || 0);
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      select: { stock: true, minStock: true, costPrice: true, salePrice: true },
    });

    const lowStockCount = products.filter((p) => Number(p.stock) <= Number(p.minStock)).length;
    const inventoryValueCost = products.reduce(
      (sum, p) => sum + Math.max(0, Number(p.stock)) * Number(p.costPrice),
      0
    );
    const inventoryValueSale = products.reduce(
      (sum, p) => sum + Math.max(0, Number(p.stock)) * Number(p.salePrice),
      0
    );

    return {
      totalRevenue,
      totalSales,
      totalAppointments: totalSales, // Alias de compatibilidad
      averageTicket,
      grossProfit,
      profitMargin,
      totalUnitsSold,
      totalProducts: products.length,
      lowStockCount,
      inventoryValueCost,
      inventoryValueSale,
      retentionRate: profitMargin,
    };
  }

  async getRevenueByProfessional(companyId: string, filters: AnalyticsFilters = {}) {
    const where = this.getBaseWhere(companyId, filters);

    const data = await prisma.sale.groupBy({
      by: ['userId'],
      where,
      _sum: { total: true },
      _count: { id: true },
    });

    const users = await prisma.user.findMany({
      where: { id: { in: data.map((d) => d.userId) } },
      select: { id: true, name: true, username: true },
    });

    return data.map((d) => {
      const u = users.find((user) => user.id === d.userId);
      return {
        name: u ? u.name : 'Cajero',
        revenue: Number(d._sum.total || 0),
        salesCount: d._count.id,
      };
    });
  }

  async getServiceProfitability(companyId: string, filters: AnalyticsFilters = {}) {
    const where = this.getBaseWhere(companyId, filters);

    const sales = await prisma.sale.findMany({
      where,
      select: { id: true },
    });

    const saleIds = sales.map((s) => s.id);
    if (saleIds.length === 0) return [];

    const items = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        companyId,
        saleId: { in: saleIds },
      },
      _sum: {
        subtotal: true,
        quantity: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: 10,
    });

    return items.map((item) => ({
      name: item.productName,
      revenue: Number(item._sum.subtotal || 0),
      count: Number(item._sum.quantity || 0),
      color: '#10b981',
    }));
  }

  async getTopClients(companyId: string, filters: AnalyticsFilters = {}) {
    const where = this.getBaseWhere(companyId, filters);

    const data = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { total: true },
      _count: { id: true },
    });

    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta Débito/Crédito',
      TRANSFER: 'Transferencia / Nequi / Daviplata',
      MIXED: 'Pago Mixto',
      CREDIT: 'Crédito / Fiado',
    };

    return data.map((d) => ({
      name: labels[d.paymentMethod] || d.paymentMethod,
      phone: d.paymentMethod,
      totalSpent: Number(d._sum.total || 0),
      appointmentsCount: d._count.id,
    }));
  }
}

export const analyticsService = new AnalyticsService();
