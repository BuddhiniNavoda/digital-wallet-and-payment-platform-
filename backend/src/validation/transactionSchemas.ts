import { z } from 'zod';
import { amountSchema, emailSchema } from './common';

export const sendMoneySchema = z
  .object({
    toEmail: emailSchema,
    amount: amountSchema,
    note: z.string().max(200, 'Note must be at most 200 characters').optional(),
  })
  .strict();

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['sent', 'received']).optional(),
});

export type SendMoneyBody = z.infer<typeof sendMoneySchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
