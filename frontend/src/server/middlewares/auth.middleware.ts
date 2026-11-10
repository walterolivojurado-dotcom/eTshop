import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AuthRequest } from '../types';
import prisma from '../lib/prisma';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (payload.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { company: true },
      });

      if (!dbUser) {
        res.status(401).json({
          success: false,
          message: 'Usuario no encontrado.',
        });
        return;
      }

      // 1. Validar estado de la Empresa (Tenant)
      if (dbUser.company && dbUser.company.isActive === false) {
        res.status(403).json({
          success: false,
          message: 'Lo sentimos, la cuenta del comercio se encuentra INACTIVA. Por favor, contacte al administrador de eTshop.',
        });
        return;
      }

      // 2. Validar estado del Usuario
      if (dbUser.isActive === false) {
        res.status(403).json({
          success: false,
          message: `Tu usuario ${dbUser.name} (${dbUser.username}) se encuentra actualmente DESACTIVADO.`,
        });
        return;
      }

      // 3. Validar Sesión Única si aplica
      if (payload.sessionId && dbUser.currentSessionId && dbUser.currentSessionId !== payload.sessionId) {
        res.status(401).json({
          success: false,
          message: 'Tu sesión ha sido iniciada en otro dispositivo o ha expirado.',
        });
        return;
      }

      payload.companyId = dbUser.companyId;
      payload.businessId = dbUser.companyId;
    }

    // AISLAMIENTO MULTI-TENANT: Validar companyId / businessId si es enviado en query/body/params
    const requestedCompanyId =
      (req.query.companyId as string) ||
      (req.query.businessId as string) ||
      req.body?.companyId ||
      req.body?.businessId ||
      req.params?.companyId ||
      req.params?.businessId;

    if (requestedCompanyId && payload.role !== 'SUPERADMIN') {
      const userCompanyId = payload.companyId || payload.businessId;
      if (userCompanyId !== requestedCompanyId) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a los datos de otra empresa.',
        });
        return;
      }
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes los permisos necesarios para realizar esta acción',
      });
      return;
    }

    next();
  };
};
