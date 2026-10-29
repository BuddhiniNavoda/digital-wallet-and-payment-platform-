import type { NextFunction, Request, Response } from 'express';
import type { ZodIssue, ZodType } from 'zod';
import { AppError } from '../lib/errors';
import type { ErrorDetail } from '../lib/errors';

function toDetails(issues: ZodIssue[]): ErrorDetail[] {
  return issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

function fail(next: NextFunction, issues: ZodIssue[]): void {
  const details = toDetails(issues);
  const first = details[0];
  const message = first
    ? first.path === 'body'
      ? first.message
      : `${first.path}: ${first.message}`
    : 'Invalid request.';

  next(new AppError('VALIDATION_ERROR', message, 400, details));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!isPlainObject(req.body)) {
      next(
        new AppError(
          'VALIDATION_ERROR',
          'Request body must be a JSON object.',
          400,
        ),
      );
      return;
    }

    const result = schema.safeParse(req.body);
    if (!result.success) {
      fail(next, result.error.issues);
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
      fail(next, result.error.issues);
      return;
    }

    req.query = result.data as Request['query'];
    next();
  };
}
