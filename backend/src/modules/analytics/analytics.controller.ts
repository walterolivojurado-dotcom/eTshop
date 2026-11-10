import { Response, NextFunction } from 'express';
import { analyticsService, AnalyticsFilters } from './analytics.service';
import { AuthRequest } from '../../types';

export class AnalyticsController {
  private getFilters(req: AuthRequest): AnalyticsFilters {
    const { startDate, endDate, userId, categoryId } = req.query;
    return {
      startDate: startDate as string,
      endDate: endDate as string,
      userId: userId as string,
      categoryId: categoryId as string,
    };
  }

  private resolveCompanyId(req: AuthRequest): string | undefined {
    return (
      (req.query.companyId as string) ||
      (req.query.businessId as string) ||
      req.user?.companyId ||
      req.user?.businessId ||
      undefined
    );
  }

  async getDashboardKPIs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = this.resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'companyId es requerido' });
      }
      const data = await analyticsService.getDashboardKPIs(companyId, this.getFilters(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueByProfessional(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = this.resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'companyId es requerido' });
      }
      const data = await analyticsService.getRevenueByProfessional(companyId, this.getFilters(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getServiceProfitability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = this.resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'companyId es requerido' });
      }
      const data = await analyticsService.getServiceProfitability(companyId, this.getFilters(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTopClients(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = this.resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'companyId es requerido' });
      }
      const data = await analyticsService.getTopClients(companyId, this.getFilters(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
