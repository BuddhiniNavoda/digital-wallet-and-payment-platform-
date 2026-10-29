import { z } from 'zod';

/**
 * Money must be a JSON number (not a string), greater than 0, at most $10,000,
 * and at most two decimal places (cents). 12.345 is rejected.
 */
export const amountSchema = z
  .number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  })
  .positive('Amount must be greater than 0')
  .max(10000, 'Single transfer limit is $10,000')
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    'Amount cannot have more than 2 decimal places',
  );

export const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .email('Email must be valid')
  .transform((value) => value.toLowerCase().trim());
