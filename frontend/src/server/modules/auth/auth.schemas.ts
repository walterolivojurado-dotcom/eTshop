import { z } from 'zod';

/**
 * En eTshop el identificador del usuario (`username` o `identifier`) puede ser
 * CUALQUIER tipo de cadena de texto (alfanumérico, con guiones, arrobas, puntos,
 * caracteres especiales, etc.), SIN restricción numérica ni de 10 dígitos.
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100),
    username: z
      .string()
      .trim()
      .min(2, 'El identificador de usuario debe tener al menos 2 caracteres')
      .max(100)
      .optional(),
    phone: z
      .string()
      .trim()
      .optional(),
    email: z
      .string()
      .email('Formato de email inválido')
      .toLowerCase()
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(4, 'La contraseña debe tener al menos 4 caracteres')
      .max(100),
    businessName: z
      .string()
      .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
      .optional(),
    companyName: z
      .string()
      .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
      .optional(),
    businessSlug: z
      .string()
      .min(2, 'El slug debe tener al menos 2 caracteres')
      .regex(/^[a-z0-9-]+$/, 'El slug solo puede tener letras minúsculas, números y guiones')
      .optional(),
    companySlug: z
      .string()
      .min(2, 'El slug debe tener al menos 2 caracteres')
      .regex(/^[a-z0-9-]+$/, 'El slug solo puede tener letras minúsculas, números y guiones')
      .optional(),
    nit: z.string().optional(),
    address: z.string().optional(),
    activeModules: z.array(z.string()).optional(),
  }).refine((data) => Boolean(data.username || data.phone), {
    message: 'Debes proporcionar un identificador de usuario (username / código / login)',
    path: ['username'],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().trim().min(1, 'El identificador de usuario es requerido').optional(),
    identifier: z.string().trim().min(1, 'El identificador de usuario es requerido').optional(),
    phone: z.string().trim().min(1, 'El identificador de usuario es requerido').optional(),
    password: z
      .string()
      .min(1, 'La contraseña es requerida'),
    businessSlug: z.string().nullable().optional(),
    companySlug: z.string().nullable().optional(),
    forceLogin: z.boolean().optional(),
  }).refine((data) => Boolean(data.username || data.identifier || data.phone), {
    message: 'El usuario o identificador es requerido',
    path: ['username'],
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];
export type LoginDto = z.infer<typeof loginSchema>['body'];
