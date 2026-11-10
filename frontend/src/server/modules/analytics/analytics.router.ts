import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de analítica requieren estar logueado
router.use(authenticate);

router.get('/kpis', (req, res, next) => analyticsController.getDashboardKPIs(req as any, res, next));
router.get('/revenue-by-professional', (req, res, next) => analyticsController.getRevenueByProfessional(req as any, res, next));
router.get('/professionals', (req, res, next) => analyticsController.getRevenueByProfessional(req as any, res, next));
router.get('/services-profitability', (req, res, next) => analyticsController.getServiceProfitability(req as any, res, next));
router.get('/services', (req, res, next) => analyticsController.getServiceProfitability(req as any, res, next));
router.get('/top-clients', (req, res, next) => analyticsController.getTopClients(req as any, res, next));
router.get('/clients', (req, res, next) => analyticsController.getTopClients(req as any, res, next));

export default router;
