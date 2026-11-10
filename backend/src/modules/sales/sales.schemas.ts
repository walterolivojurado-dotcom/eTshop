import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    companyId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
    customerName: z.string().max(150).optional().default('Cliente Mostrador'),
    customerDoc: z.string().max(50).optional(),
    customerPhone: z.string().max(50).optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED', 'CREDIT']).default('CASH'),
    amountReceived: z.coerce.number().min(0).optional(),
    discountAmount: z.coerce.number().min(0).default(0),
    notes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid('ID de producto inválido'),
          quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
          unitPrice: z.coerce.number().min(0).optional(),
          discount: z.coerce.number().min(0).default(0),
        })
      )
      .min(1, 'La venta debe contener al menos un producto'),
  }),
});

export const cancelSaleSchema = z.object({
  body: z.object({
    reason: z.string().max(300).optional(),
    status: z.enum(['CANCELLED', 'REFUNDED']).default('CANCELLED'),
  }),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>['body'];
export type CancelSaleDto = z.infer<typeof cancelSaleSchema>['body'];

