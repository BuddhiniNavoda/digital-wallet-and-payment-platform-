import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  req.requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}
