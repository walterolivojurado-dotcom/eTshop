import { Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
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

export class InventoryController {
  async listCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await inventoryService.listCategories(companyId, includeInactive);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const category = await inventoryService.createCategory(companyId, req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const category = await inventoryService.updateCategory(companyId, req.params.id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      await inventoryService.deleteCategory(companyId, req.params.id);
      res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
      next(error);
    }
  }

  async listProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const products = await inventoryService.listProducts(companyId, {
        search: req.query.search as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        lowStockOnly: req.query.lowStockOnly === 'true',
        includeInactive: req.query.includeInactive === 'true',
      });
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const product = await inventoryService.createProduct(companyId, req.user!.userId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const product = await inventoryService.updateProduct(
        companyId,
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const result = await inventoryService.adjustStock(
        companyId,
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStockMovements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const productId = req.query.productId as string | undefined;
      const movements = await inventoryService.getStockMovements(companyId, productId);
      res.json({ success: true, data: movements });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      await inventoryService.deleteProduct(companyId, req.params.id);
      res.json({ success: true, message: 'Producto desactivado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
