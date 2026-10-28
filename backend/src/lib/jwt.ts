import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errors';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded !== 'object' || decoded === null) {
      throw new AppError('UNAUTHORIZED', 'Invalid access token.', 401);
    }

    const { userId, email } = decoded as AccessTokenPayload;
    if (!userId || !email) {
      throw new AppError('UNAUTHORIZED', 'Invalid access token.', 401);
    }

    return { userId, email };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('UNAUTHORIZED', 'Invalid or expired access token.', 401);
  }
}
