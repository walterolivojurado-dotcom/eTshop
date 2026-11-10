import { Response, NextFunction } from 'express';
import { salesService } from './sales.service';
import { AuthRequest } from '../../types';
import { createError } from '../../middlewares/error.middleware';

const resolveCompanyId = (req: AuthRequest): string => {
  const id =
    (req.query.companyId as string) ||
    (req.query.businessId as string) ||
    req.body?.companyId ||
    req.body?.businessId ||
    req.user?.companyId ||
    req.user?.businessId;

  if (!id) {
    throw createError('Debes especificar la empresa (companyId)', 400);
  }
  return id;
};

export class SalesController {
  async createSale(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const sale = await salesService.createSale(companyId, req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Venta registrada exitosamente',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  async listSales(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const sales = await salesService.listSales(companyId, {
        status: req.query.status as string | undefined,
        paymentMethod: req.query.paymentMethod as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: sales });
    } catch (error) {
      next(error);
    }
  }

  async getSaleById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const sale = await salesService.getSaleById(companyId, req.params.id);
      res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  async cancelSale(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const sale = await salesService.cancelSale(companyId, req.params.id, req.body);
      res.json({
        success: true,
        message: 'Venta anulada y stock restaurado en el inventario',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
