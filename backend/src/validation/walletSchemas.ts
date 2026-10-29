import { z } from 'zod';
import { amountSchema } from './common';

export { amountSchema };

export const depositSchema = z
  .object({
    amount: amountSchema,
  })
  .strict();

export type DepositBody = z.infer<typeof depositSchema>;
