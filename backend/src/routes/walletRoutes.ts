import { Router } from 'express';
import * as walletController from '../controllers/walletController';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { depositSchema } from '../validation/walletSchemas';

export const walletRouter = Router();

walletRouter.use(requireAuth);

walletRouter.get('/balance', asyncHandler(walletController.getBalance));
walletRouter.post(
  '/deposit',
  validateBody(depositSchema),
  asyncHandler(walletController.deposit),
);
