import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireRole(['SUPERADMIN']));

router.get('/businesses', (req, res, next) => adminController.getBusinesses(req as any, res, next));
router.get('/companies', (req, res, next) => adminController.getBusinesses(req as any, res, next));
router.get('/modules', (req, res, next) => adminController.getModules(req as any, res, next));
router.patch('/businesses/:id/status', (req, res, next) => adminController.updateBusinessStatus(req as any, res, next));
router.patch('/companies/:id/status', (req, res, next) => adminController.updateBusinessStatus(req as any, res, next));
router.patch('/businesses/:id/subscription', (req, res, next) => adminController.updateBusinessSubscription(req as any, res, next));
router.patch('/companies/:id/subscription', (req, res, next) => adminController.updateBusinessSubscription(req as any, res, next));
router.get('/users', (req, res, next) => adminController.getUsers(req as any, res, next));

export default router;
