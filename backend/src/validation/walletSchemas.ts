import { z } from 'zod';

export const amountSchema = z
  .number()
  .positive('Amount must be greater than 0')
  .multipleOf(0.01, 'Amount cannot have more than 2 decimal places')
  .max(10000, 'Single transfer limit is $10,000');

export const depositSchema = z.object({
  amount: amountSchema,
});

export type DepositBody = z.infer<typeof depositSchema>;
