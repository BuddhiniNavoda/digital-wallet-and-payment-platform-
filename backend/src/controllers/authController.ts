import type { Request, Response } from 'express';
import { log } from '../lib/logger';
import * as authService from '../services/authService';
import type { LoginBody, RegisterBody } from '../validation/authSchemas';

export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.register(req.body as RegisterBody);
  log('info', 'User registered', { requestId: req.requestId });
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginBody);
  res.cookie(
    authService.REFRESH_COOKIE,
    result.refreshToken,
    authService.refreshCookieOptions(),
  );
  log('info', 'User logged in', { requestId: req.requestId });
  res.json({
    accessToken: result.accessToken,
    user: result.user,
  });
}

function cookieValue(req: Request): string | undefined {
  const value = req.cookies[authService.REFRESH_COOKIE];
  return typeof value === 'string' ? value : undefined;
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const accessToken = await authService.refresh(cookieValue(req));
  log('info', 'Access token refreshed', { requestId: req.requestId });
  res.json({ accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(cookieValue(req));
  res.clearCookie(
    authService.REFRESH_COOKIE,
    authService.refreshCookieOptions(),
  );
  log('info', 'User logged out', { requestId: req.requestId });
  res.status(204).send();
}
