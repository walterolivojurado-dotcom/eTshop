import { Router } from 'express';
import { salesController } from './sales.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createSaleSchema, cancelSaleSchema } from './sales.schemas';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => salesController.listSales(req as any, res, next));
router.post('/', validate(createSaleSchema), (req, res, next) => salesController.createSale(req as any, res, next));
router.get('/:id', (req, res, next) => salesController.getSaleById(req as any, res, next));
router.post('/:id/cancel', validate(cancelSaleSchema), (req, res, next) => salesController.cancelSale(req as any, res, next));

export default router;
