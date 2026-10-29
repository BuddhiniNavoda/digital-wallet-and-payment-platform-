import type { Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { formatMoney } from '../lib/money';
import { log } from '../lib/logger';
import * as walletService from '../services/walletService';
import type { DepositBody } from '../validation/walletSchemas';

function userIdFrom(req: Request): string {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Access token is required.', 401);
  }
  return userId;
}

export async function getBalance(req: Request, res: Response): Promise<void> {
  const wallet = await walletService.getBalance(userIdFrom(req));
  res.json({ wallet });
}

export async function deposit(req: Request, res: Response): Promise<void> {
  const body = req.body as DepositBody;
  const result = await walletService.deposit(userIdFrom(req), body.amount);
  log('info', 'Deposit completed', { requestId: req.requestId });
  res.status(201).json({
    wallet: result.wallet,
    transaction: {
      id: result.transaction.id,
      amount: formatMoney(result.transaction.amount),
      type: result.transaction.type,
      status: result.transaction.status,
    },
  });
}
