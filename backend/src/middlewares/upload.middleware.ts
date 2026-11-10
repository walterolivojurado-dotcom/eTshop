import multer from 'multer';
import { createError } from './error.middleware';
import { Request } from 'express';

const memoryStorage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError('Solo se permiten imágenes (JPG, PNG, WEBP, SVG, ICO)', 400) as any, false);
  }
};

export const uploadAvatar = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export const uploadBranding = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});
