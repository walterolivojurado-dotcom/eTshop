import { z } from 'zod';

export const createBusinessSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120),
    description: z.string().max(500).optional(),
    nit: z.string().max(50).optional(),
    address: z.string().max(250).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal('')),
    currency: z.string().default('COP'),
    timezone: z.string().default('America/Bogota'),
    logoUrl: z.string().optional(),
  }),
});

export const updateBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(500).optional(),
    nit: z.string().max(50).optional(),
    address: z.string().max(250).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal('')),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    logoUrl: z.string().nullable().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
    activeModules: z.array(z.string()).optional(),
  }),
});

export type CreateBusinessDto = z.infer<typeof createBusinessSchema>['body'];
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>['body'];
