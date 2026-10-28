// Same bcrypt algorithm as the assignment (cost 12). bcryptjs avoids a native Windows build.
import bcrypt from 'bcryptjs';
import { pool } from '../db/postgres';
import { redis } from '../db/redis';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { signAccessToken } from '../lib/jwt';
import { createRefreshToken, hashRefreshToken } from '../lib/tokens';
import * as userModel from '../models/userModel';
import { insertWallet } from '../models/walletModel';
import * as refreshTokenModel from '../models/refreshTokenModel';
import type { LoginBody, RegisterBody } from '../validation/authSchemas';

const BCRYPT_ROUNDS = 12;
const LOGIN_FAILURE_TTL_SECONDS = 15 * 60;
const LOGIN_FAILURE_LIMIT = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const REFRESH_COOKIE = 'refreshToken';

export { REFRESH_COOKIE };

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
}

function toPublicUser(user: userModel.UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    createdAt: user.created_at,
  };
}

function failureKey(email: string): string {
  return `login-failures:${email}`;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}

async function recordFailedLogin(email: string, userId?: string): Promise<void> {
  const key = failureKey(email);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, LOGIN_FAILURE_TTL_SECONDS);
  }

  if (count >= LOGIN_FAILURE_LIMIT && userId) {
    await userModel.lockUntil(userId, new Date(Date.now() + LOCKOUT_MS));
  }
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax' as const,
    path: '/auth',
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000,
  };
}

export async function register(body: RegisterBody): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const user = await userModel.insertUser(client, {
      email: body.email,
      passwordHash,
      fullName: body.fullName,
    });
    await insertWallet(client, user.id);
    await client.query('COMMIT');
    return toPublicUser(user);
  } catch (err) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(err)) {
      throw new AppError(
        'EMAIL_ALREADY_EXISTS',
        'An account with this email already exists.',
        409,
      );
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function login(body: LoginBody): Promise<{
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}> {
  const user = await userModel.findByEmail(body.email);

  if (user?.locked_until && user.locked_until > new Date()) {
    throw new AppError(
      'ACCOUNT_LOCKED',
      'Too many failed attempts. Try again later.',
      429,
    );
  }

  const passwordOk = user
    ? await bcrypt.compare(body.password, user.password_hash)
    : false;

  if (!user || !passwordOk) {
    await recordFailedLogin(body.email, user?.id);
    throw new AppError(
      'INVALID_CREDENTIALS',
      'Invalid email or password.',
      401,
    );
  }

  await redis.del(failureKey(body.email));

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(
    Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000,
  );

  await refreshTokenModel.insertRefreshToken({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function refresh(rawToken: string | undefined): Promise<string> {
  if (!rawToken) {
    throw new AppError('UNAUTHORIZED', 'Refresh token cookie is missing.', 401);
  }

  const row = await refreshTokenModel.findValidByHash(hashRefreshToken(rawToken));
  if (!row || row.revoked || row.expires_at <= new Date()) {
    throw new AppError('UNAUTHORIZED', 'Refresh token is invalid or expired.', 401);
  }

  const user = await userModel.findById(row.user_id);
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Refresh token is invalid or expired.', 401);
  }

  return signAccessToken({ userId: user.id, email: user.email });
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await refreshTokenModel.revokeByHash(hashRefreshToken(rawToken));
}
