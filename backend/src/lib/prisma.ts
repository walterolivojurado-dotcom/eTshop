import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Singleton pattern: evita múltiples instancias en desarrollo con hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma DB error', { message: e.message, target: e.target });
});

(prisma as any).$on('warn', (e: any) => {
  logger.warn('Prisma DB warning', { message: e.message, target: e.target });
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
