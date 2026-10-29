import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../lib/errors';

function fail(next: NextFunction, message: string | undefined): void {
  next(
    new AppError(
      'VALIDATION_ERROR',
      message ?? 'Invalid request.',
      400,
    ),
  );
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      fail(next, result.error.issues[0]?.message);
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      fail(next, result.error.issues[0]?.message);
      return;
    }

    req.query = result.data as Request['query'];
    next();
  };
}
