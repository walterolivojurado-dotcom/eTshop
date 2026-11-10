import { Response, NextFunction } from 'express';
import { roleProfileService } from './role-profile.service';
import { AuthRequest } from '../../types';

export class RoleProfileController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.body.companyId || req.body.businessId || req.user?.companyId || req.user?.businessId;
      const profile = await roleProfileService.create({ ...req.body, companyId });
      res.status(201).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId =
        (req.query.companyId as string) ||
        (req.query.businessId as string) ||
        req.user?.companyId ||
        req.user?.businessId;
      const includeInactive = req.query.includeInactive === 'true';

      if (!companyId) {
        res.json({ success: true, data: [] });
        return;
      }

      const profiles = await roleProfileService.listByBusiness(companyId, includeInactive);
      res.json({ success: true, data: profiles });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId =
        req.body.companyId ||
        req.body.businessId ||
        (req.query.companyId as string) ||
        (req.query.businessId as string) ||
        req.user?.companyId ||
        req.user?.businessId;

      const profile = await roleProfileService.update(companyId!, req.params.id, req.body);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId =
        (req.query.companyId as string) ||
        (req.query.businessId as string) ||
        req.user?.companyId ||
        req.user?.businessId;

      const profile = await roleProfileService.deactivate(companyId!, req.params.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyModules(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId =
        (req.query.companyId as string) ||
        (req.query.businessId as string) ||
        req.user?.companyId ||
        req.user?.businessId;

      if (!companyId) {
        res.json({ success: true, data: [] });
        return;
      }

      const modules = await roleProfileService.getCompanyModules(companyId);
      res.json({ success: true, data: modules });
    } catch (error) {
      next(error);
    }
  }

  async toggleCompanyModule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId =
        req.body.companyId ||
        req.body.businessId ||
        req.user?.companyId ||
        req.user?.businessId;
      const { code, isEnabled } = req.body;

      const updated = await roleProfileService.toggleCompanyModule(companyId!, code, Boolean(isEnabled));
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

export const roleProfileController = new RoleProfileController();
