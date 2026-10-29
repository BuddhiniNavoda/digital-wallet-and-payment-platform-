import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { log } from '../lib/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId: req.requestId,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof SyntaxError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body must be valid JSON.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const detail = err instanceof Error ? err.message : 'Unhandled error';
  log('error', detail, { requestId: req.requestId });
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      requestId: req.requestId,
    },
  });
}
