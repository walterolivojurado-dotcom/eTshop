import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { uploadBranding } from '../../middlewares/upload.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

/**
 * DEBUG PING
 */
router.get('/ping', (_req, res) => {
  res.status(200).json({ success: true, message: 'settings-router-pong' });
});

/**
 * Endpoint PÚBLICO para servir el binario del favicon activo en la pestaña del navegador
 */
router.get('/favicon', (req, res, next) => settingsController.getFavicon(req, res, next));

/**
 * Endpoint PÚBLICO para cargar la identidad visual en el login
 */
router.get('/public/:identifier', (req, res, next) => settingsController.getPublic(req, res, next));

/**
 * Endpoint PROTEGIDO para actualizar la configuración
 */
router.patch('/branding', authenticate, (req, res, next) => settingsController.updateBranding(req as any, res, next));

/**
 * Endpoint PROTEGIDO para subir imágenes de branding
 */
router.post('/upload', authenticate, uploadBranding.single('file'), (req, res, next) => settingsController.upload(req, res, next));

/**
 * Endpoints PROTEGIDOS para la pasarela de pagos
 */
router.get('/payment-config', authenticate, authorize('ADMIN', 'SUPERADMIN'), (req, res, next) => settingsController.getPaymentConfig(req as any, res, next));
router.patch('/payment-config', authenticate, authorize('ADMIN', 'SUPERADMIN'), (req, res, next) => settingsController.updatePaymentConfig(req as any, res, next));

export default router;
