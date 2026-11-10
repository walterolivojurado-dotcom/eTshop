import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema } from './auth.schemas';

import { Role } from '@prisma/client';

const router = Router();

// POST /api/auth/register (Only SUPERADMIN can create new businesses)
router.post(
  '/register',
  authenticate,
  requireRole([Role.SUPERADMIN]),
  validate(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

// POST /api/auth/refresh  (uses HttpOnly cookie)
router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

// POST /api/auth/logout  (requires auth to clear server-side token)
router.post('/logout', authenticate, (req, res, next) =>
  authController.logout(req as any, res, next)
);

// DEBUG: Verify router mounting
router.get('/debug-router', (req, res) => {
  res.json({
    success: true,
    message: 'Auth router is active',
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method
  });
});

// PATCH /api/auth/me/profile
router.patch('/me/profile', authenticate, (req, res, next) =>
  authController.updateProfile(req as any, res, next)
);

// PATCH /api/auth/me/password
router.patch('/me/password', authenticate, (req, res, next) =>
  authController.updatePassword(req as any, res, next)
);

// GET /api/auth/migrate-clients (Temporary migration route)
router.get('/migrate-clients', (req, res, next) =>
  authController.migrateClients(req, res, next)
);

// GET /api/auth/me (requires auth)
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req as any, res, next)
);

export default router;
