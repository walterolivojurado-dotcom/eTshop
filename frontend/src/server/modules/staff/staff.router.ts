import { Router } from 'express';
import { staffController } from './staff.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createStaffSchema, updateStaffSchema } from './staff.schemas';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => staffController.list(req as any, res, next));
router.post('/', validate(createStaffSchema), (req, res, next) => staffController.create(req as any, res, next));
router.patch('/:id', validate(updateStaffSchema), (req, res, next) => staffController.update(req as any, res, next));

export default router;
