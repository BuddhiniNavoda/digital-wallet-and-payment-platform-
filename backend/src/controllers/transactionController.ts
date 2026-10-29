import type { Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { log } from '../lib/logger';
import * as transactionService from '../services/transactionService';
import type {
  HistoryQuery,
  SendMoneyBody,
} from '../validation/transactionSchemas';

function userIdFrom(req: Request): string {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Access token is required.', 401);
  }
  return userId;
}

export async function send(req: Request, res: Response): Promise<void> {
  const body = req.body as SendMoneyBody;
  const transaction = await transactionService.sendMoney(userIdFrom(req), body);
  log('info', 'Transfer completed', { requestId: req.requestId });
  res.status(201).json({ transaction });
}

export async function history(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as HistoryQuery;
  const result = await transactionService.getHistory(userIdFrom(req), query);
  res.json(result);
}
