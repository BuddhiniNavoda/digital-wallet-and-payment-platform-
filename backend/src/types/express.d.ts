import type { AccessTokenPayload } from '../lib/jwt';

export {};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      cookies: Record<string, string | undefined>;
      user?: AccessTokenPayload;
    }
  }
}
