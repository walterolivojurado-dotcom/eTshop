import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
} from './inventory.schemas';

const router = Router();

router.use(authenticate);

// Categorías
router.get('/categories', (req, res, next) => inventoryController.listCategories(req as any, res, next));
router.post('/categories', validate(createCategorySchema), (req, res, next) => inventoryController.createCategory(req as any, res, next));
router.patch('/categories/:id', validate(updateCategorySchema), (req, res, next) => inventoryController.updateCategory(req as any, res, next));
router.delete('/categories/:id', (req, res, next) => inventoryController.deleteCategory(req as any, res, next));

// Productos
router.get('/products', (req, res, next) => inventoryController.listProducts(req as any, res, next));
router.post('/products', validate(createProductSchema), (req, res, next) => inventoryController.createProduct(req as any, res, next));
router.patch('/products/:id', validate(updateProductSchema), (req, res, next) => inventoryController.updateProduct(req as any, res, next));
router.post('/products/:id/adjust-stock', validate(adjustStockSchema), (req, res, next) => inventoryController.adjustStock(req as any, res, next));
router.delete('/products/:id', (req, res, next) => inventoryController.deleteProduct(req as any, res, next));

// Kardex / Movimientos de stock
router.get('/movements', (req, res, next) => inventoryController.getStockMovements(req as any, res, next));

export default router;

