import { Response, NextFunction } from 'express';
import { staffService } from './staff.service';
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

export class StaffController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const users = await staffService.listByCompany(companyId);
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const user = await staffService.createStaff(companyId, req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = resolveCompanyId(req);
      const user = await staffService.updateStaff(companyId, req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

export const staffController = new StaffController();

