import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  historyQuerySchema,
  sendMoneySchema,
} from '../validation/transactionSchemas';

export const transactionRouter = Router();

transactionRouter.use(requireAuth);

transactionRouter.post(
  '/send',
  validateBody(sendMoneySchema),
  asyncHandler(transactionController.send),
);

transactionRouter.get(
  '/history',
  validateQuery(historyQuerySchema),
  asyncHandler(transactionController.history),
);
