import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthRequest } from '../../types';
import config from '../../config';

const REFRESH_COOKIE = 'etambo_refresh';

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth/refresh',
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);

      res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

      res.status(201).json({
        success: true,
        message: 'Cuenta creada exitosamente',
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);

      res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

      res.status(200).json({
        success: true,
        message: 'Sesión iniciada exitosamente',
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE];

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Refresh token no encontrado',
        });
        return;
      }

      const { accessToken } = await authService.refresh(token);

      res.status(200).json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await authService.logout(req.user.userId);
      }

      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });

      res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new Error('No autenticado');
      const user = await authService.updateProfile(req.user.userId, req.body);
      res.status(200).json({ success: true, message: 'Perfil actualizado exitosamente', data: { user } });
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new Error('No autenticado');
      await authService.updatePassword(req.user.userId, req.body);
      res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async migrateClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Basic security check via header
      const key = req.headers['x-migration-key'];
      if (key !== 'calenbaq-migrate-2026') {
        res.status(403).json({ success: false, message: 'No autorizado' });
        return;
      }

      const result = await authService.migrateClients();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
