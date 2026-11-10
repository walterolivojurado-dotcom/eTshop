import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validate =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        res.status(400).json({
          success: false,
          message: issues[0]?.message || 'Error de validación en los datos enviados',
          errors: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : '',
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
