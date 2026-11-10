import { Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { AuthRequest } from '../../types';

export class AdminController {
  async getBusinesses(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const businesses = await adminService.getAllBusinesses();
      res.json({ success: true, data: businesses });
    } catch (error) {
      next(error);
    }
  }

  async updateBusinessStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const business = await adminService.updateBusinessStatus(id, Boolean(isActive));
      res.json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  async updateBusinessSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { maxUsers, maxProfessionals, activeModules, planName } = req.body;
      const limit = maxUsers ?? maxProfessionals ?? 5;
      const business = await adminService.updateBusinessSubscription(
        id,
        Number(limit),
        Array.isArray(activeModules) ? activeModules : [],
        planName
      );
      res.json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  async getModules(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const modules = await adminService.getCatalogModules();
      res.json({ success: true, data: modules });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await adminService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
