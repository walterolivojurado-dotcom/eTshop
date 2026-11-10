import { Request, Response, NextFunction } from 'express';
import { businessService } from './business.service';
import { AuthRequest } from '../../types';

export class BusinessController {
  /**
   * POST /api/businesses — Create a new business
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const business = await businessService.create(req.user!.userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Negocio creado exitosamente',
        data: { business },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/businesses/me — List my businesses
   */
  async getMyBusinesses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businesses = await businessService.getMyBusinesses(req.user!.userId, req.user!.role);

      res.status(200).json({
        success: true,
        data: { businesses },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/businesses/:slug — Public business profile
   */
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const business = await businessService.getBySlug(req.params.slug);

      res.status(200).json({
        success: true,
        data: {
          ...business,
          business,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/businesses/:id — Update business (owner only)
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const business = await businessService.update(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Negocio actualizado exitosamente',
        data: { business },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const businessController = new BusinessController();
