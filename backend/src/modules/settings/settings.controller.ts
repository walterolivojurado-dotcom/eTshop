import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { AuthRequest } from '../../types';

export class SettingsController {
  /**
   * GET /api/settings/favicon
   * Devuelve el binario del favicon activo (de ?slug=... o de la plataforma 'calenbaq')
   */
  async getFavicon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedUrl = new URL(req.url || '', 'http://localhost');
      const querySlug = parsedUrl.searchParams.get('slug');
      const rawQuery = req.query.slug;
      const fallbackSlug =
        querySlug ||
        (typeof rawQuery === 'string' ? rawQuery : 'etshop');
      const settings = await settingsService.getPublicSettings(fallbackSlug);
      const iconSource = settings?.faviconUrl || settings?.logoUrl;

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

      if (iconSource && iconSource.startsWith('data:')) {
        const matches = iconSource.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', mimeType);
          res.status(200).send(buffer);
          return;
        }
      }

      if (iconSource && iconSource.startsWith('http')) {
        res.redirect(302, iconSource);
        return;
      }

      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ea580c"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="36">e</text></svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(fallbackSvg);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/settings/public/:identifier
   * Obtiene datos públicos (logo, nombre) para el login sin estar autenticado
   */
  async getPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.params;
      const settings = await settingsService.getPublicSettings(identifier);

      // Desactivar caché explícitamente para evitar estados stale en el branding
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/settings/branding
   * Actualiza la identidad visual (requiere autenticación)
   */
  async updateBranding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { businessId, companyName, logoUrl, faviconUrl, theme } = req.body;
      const ownerId = req.user!.userId;
      const userRole = req.user!.role;
      const userBusinessId = req.user!.businessId;

      if (!businessId) {
        res.status(400).json({ success: false, message: 'businessId es requerido' });
        return;
      }

      const updated = await settingsService.updateBranding(
        businessId, 
        ownerId, 
        userRole, 
        { companyName, logoUrl, faviconUrl, theme },
        userBusinessId ?? undefined
      );

      res.status(200).json({
        success: true,
        message: 'Identidad visual actualizada',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/settings/upload
   * Sube una imagen para branding y devuelve su Data URI Base64 persistente
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ success: false, message: 'No se ha recibido el archivo' });
        return;
      }

      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

      res.status(200).json({
        success: true,
        data: {
          url: dataUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/settings/payment-config
   * Obtiene la configuración de pasarela de pagos
   */
  async getPaymentConfig(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) {
        res.status(400).json({ success: false, message: 'businessId es requerido o no está vinculado a un negocio' });
        return;
      }

      const config = await settingsService.getPaymentConfig(businessId);
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/settings/payment-config
   * Crea o actualiza la configuración de pasarela de pagos
   */
  async updatePaymentConfig(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;
      const { provider, publicKey, accessToken, isActive } = req.body;

      if (!businessId) {
        res.status(400).json({ success: false, message: 'businessId es requerido o no está vinculado a un negocio' });
        return;
      }
      if (!provider || !publicKey || !accessToken) {
        res.status(400).json({ success: false, message: 'provider, publicKey y accessToken son requeridos' });
        return;
      }

      const config = await settingsService.updatePaymentConfig(businessId, {
        provider,
        publicKey,
        accessToken,
        isActive: isActive ?? true,
      });

      res.status(200).json({
        success: true,
        message: 'Configuración de pasarela de pagos actualizada',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
