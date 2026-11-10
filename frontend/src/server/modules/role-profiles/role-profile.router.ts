import { Router } from 'express';
import { roleProfileController } from './role-profile.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createRoleProfileSchema, updateRoleProfileSchema } from './role-profile.schemas';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => roleProfileController.list(req as any, res, next));
router.post('/', validate(createRoleProfileSchema), (req, res, next) => roleProfileController.create(req as any, res, next));
router.patch('/:id', validate(updateRoleProfileSchema), (req, res, next) => roleProfileController.update(req as any, res, next));
router.delete('/:id', (req, res, next) => roleProfileController.deactivate(req as any, res, next));

// Rutas para gestión de Módulos por Empresa (company_modules)
router.get('/company-modules', (req, res, next) => roleProfileController.getCompanyModules(req as any, res, next));
router.patch('/company-modules/toggle', (req, res, next) => roleProfileController.toggleCompanyModule(req as any, res, next));

export default router;
