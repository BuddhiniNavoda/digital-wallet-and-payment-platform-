import { Router } from 'express';
import * as authController from '../controllers/authController';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validation/authSchemas';

export const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
