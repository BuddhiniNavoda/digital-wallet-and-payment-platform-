import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../lib/errors';

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      next(
        new AppError(
          'VALIDATION_ERROR',
          first?.message ?? 'Invalid request body.',
          400,
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}
