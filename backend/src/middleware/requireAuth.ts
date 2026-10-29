import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { verifyAccessToken } from '../lib/jwt';

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(
      new AppError(
        'UNAUTHORIZED',
        'Access token is required.',
        401,
      ),
    );
    return;
  }

  try {
    req.user = verifyAccessToken(header.slice('Bearer '.length));
    next();
  } catch (err) {
    next(err);
  }
}
