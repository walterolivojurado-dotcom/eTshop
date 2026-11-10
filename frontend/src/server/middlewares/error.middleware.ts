import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

/**
 * Global error handler — MUST be registered last in Express middleware chain.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const isOperational = err.isOperational ?? false;

  logger.error(`[${req.method}] ${req.url} → ${statusCode}`, {
    message: err.message,
    stack: statusCode === 500 ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    code: err.code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  const message = `Ruta no encontrada: ${req.method} ${req.originalUrl}`;
  logger.warn(`[404] ${message}`);
  
  res.status(404).json({
    success: false,
    message,
  });
};

/** Helper para crear errores operacionales tipados */
export const createError = (
  message: string,
  statusCode: number,
  code?: string
): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  if (code) {
    err.code = code;
  }
  return err;
};
