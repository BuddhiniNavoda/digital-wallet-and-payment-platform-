import { z } from 'zod';
import { emailSchema } from './common';

export const registerSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string',
      })
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    fullName: z
      .string({
        required_error: 'Full name is required',
        invalid_type_error: 'Full name must be a string',
      })
      .min(1, 'Full name is required')
      .max(100, 'Full name must be at most 100 characters')
      .trim(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string',
      })
      .min(1, 'Password is required')
      .max(72, 'Password must be at most 72 characters'),
  })
  .strict();

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
