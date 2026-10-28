import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email must be valid').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required').max(100).trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Email must be valid').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
