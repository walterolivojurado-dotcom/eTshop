import { z } from 'zod';

/**
 * Validación flexible para personal de comercio (Cajeros, Inventario, Administradores):
 * El campo `username` puede ser cualquier cadena de texto libre (alfanumérico, con guiones,
 * símbolos, etc.) sin restricción de 10 dígitos numéricos.
 */
export const createStaffSchema = z.object({
  body: z.object({
    companyId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
    name: z.string().min(2, 'El nombre es requerido').max(100),
    username: z
      .string()
      .trim()
      .min(2, 'El identificador debe tener al menos 2 caracteres')
      .max(100),
    phone: z.string().trim().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    password: z
      .string()
      .min(4, 'La contraseña debe tener al menos 4 caracteres'),
    role: z.enum(['ADMIN', 'CASHIER', 'INVENTORY']).default('CASHIER'),
    roleProfileId: z.string().uuid().nullable().optional().or(z.literal('')),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateStaffSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    username: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().nullable().optional(),
    email: z.string().email().nullable().optional().or(z.literal('')),
    password: z.string().min(4).optional(),
    role: z.enum(['ADMIN', 'CASHIER', 'INVENTORY']).optional(),
    roleProfileId: z.string().uuid().nullable().optional().or(z.literal('')),
    isActive: z.boolean().optional(),
  }),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>['body'];
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>['body'];
