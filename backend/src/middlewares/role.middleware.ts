import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';

/**
 * Middleware de autorización RBAC.
 * Uso: router.get('/admin', authenticate, authorize('ADMIN'), handler)
 */
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
      });
      return;
    }

    next();
  };
};
