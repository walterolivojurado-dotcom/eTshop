import { z } from 'zod';

export const createRoleProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre del perfil es requerido').max(80),
    modules: z.array(z.string()).default([]),
    isGlobalViewEnabled: z.boolean().optional().default(true),
    companyId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
  }),
});

export const updateRoleProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    modules: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    isGlobalViewEnabled: z.boolean().optional(),
    companyId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
  }),
});

export type CreateRoleProfileDto = z.infer<typeof createRoleProfileSchema>['body'];
export type UpdateRoleProfileDto = z.infer<typeof updateRoleProfileSchema>['body'];
