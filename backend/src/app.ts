import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import prisma from './lib/prisma';

import config from './config';
import { errorHandler, notFound } from './middlewares/error.middleware';
import { authenticate } from './middlewares/auth.middleware';
import { authController } from './modules/auth/auth.controller';

import authRouter from './modules/auth/auth.router';
import businessRouter from './modules/business/business.router';
import settingsRouter from './modules/settings/settings.router';
import adminRouter from './modules/admin/admin.router';
import roleProfileRouter from './modules/role-profiles/role-profile.router';
import analyticsRouter from './modules/analytics/analytics.router';
import inventoryRouter from './modules/inventory/inventory.router';
import salesRouter from './modules/sales/sales.router';
import staffRouter from './modules/staff/staff.router';

const app = express();

app.set('trust proxy', 1);

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {}
}

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  globalLimiter(req, res, next);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(
  '/uploads',
  cors({ origin: '*', credentials: false }),
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(uploadsDir)
);

app.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'eTshop API is alive' });
});

app.get('/api/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    success: true,
    message: 'eTshop POS & Inventory Multi-Tenant API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    diagnostics: {
      node: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      db: dbStatus,
    },
  });
});

app.put('/api/client/profile', authenticate, (req, res, next) =>
  authController.updateProfile(req as any, res, next)
);
app.use('/api/auth', authRouter);
app.use('/api/businesses', businessRouter);
app.use('/api/companies', businessRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/role-profiles', roleProfileRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/sales', salesRouter);
app.use('/api/staff', staffRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
