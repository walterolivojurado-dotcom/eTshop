import { Router } from 'express';
import { businessController } from './business.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createBusinessSchema, updateBusinessSchema } from './business.schemas';

const router = Router();

// POST /api/businesses — Create a business (authenticated)
router.post(
  '/',
  authenticate,
  validate(createBusinessSchema),
  (req, res, next) => businessController.create(req as any, res, next)
);

// GET /api/businesses/me — List my businesses (authenticated)
router.get(
  '/me',
  authenticate,
  (req, res, next) => businessController.getMyBusinesses(req as any, res, next)
);

// GET /api/businesses/:slug — Public business profile
router.get(
  '/:slug',
  (req, res, next) => businessController.getBySlug(req, res, next)
);

// PATCH /api/businesses/:id — Update business (owner only)
router.patch(
  '/:id',
  authenticate,
  validate(updateBusinessSchema),
  (req, res, next) => businessController.update(req as any, res, next)
);

export default router;
