import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre de la categoría es requerido').max(100),
    description: z.string().max(300).optional(),
    color: z.string().default('#10b981'),
    icon: z.string().optional().default('Tag'),
    isActive: z.boolean().optional().default(true),
    companyId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(300).nullable().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre del producto es requerido').max(150),
    brand: z.string().max(100).nullable().optional(),
    description: z.string().max(500).optional(),
    categoryId: z.string().uuid().nullable().optional().or(z.literal('')),
    sku: z.string().max(80).optional(),
    barcode: z.string().max(100).optional(),
    costPrice: z.coerce.number().min(0).default(0),
    salePrice: z.coerce.number().min(0).default(0),
    taxRate: z.coerce.number().min(0).max(100).default(0),
    stock: z.coerce.number().default(0),
    minStock: z.coerce.number().min(0).default(5),
    unit: z.string().max(20).default('UND'),
    imageUrl: z.string().nullable().optional(),
    isActive: z.boolean().optional().default(true),
    companyId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    brand: z.string().max(100).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional().or(z.literal('')),
    sku: z.string().max(80).nullable().optional(),
    barcode: z.string().max(100).nullable().optional(),
    costPrice: z.coerce.number().min(0).optional(),
    salePrice: z.coerce.number().min(0).optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    stock: z.coerce.number().optional(),
    minStock: z.coerce.number().min(0).optional(),
    unit: z.string().max(20).optional(),
    imageUrl: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    type: z.enum(['PURCHASE', 'ADJUSTMENT', 'RETURN', 'INITIAL']).default('ADJUSTMENT'),
    quantity: z.coerce.number(),
    notes: z.string().max(300).optional(),
    companyId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
  }),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>['body'];
export type CreateProductDto = z.infer<typeof createProductSchema>['body'];
export type UpdateProductDto = z.infer<typeof updateProductSchema>['body'];
export type AdjustStockDto = z.infer<typeof adjustStockSchema>['body'];
