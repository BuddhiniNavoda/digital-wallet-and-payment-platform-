import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { pool } from './db/postgres';
import { redis } from './db/redis';
import { openApiSpec } from './docs/openapi';
import { log } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { authRouter } from './routes/authRoutes';

const app = express();

app.use(requestId);
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/auth', authRouter);

if (env.nodeEnv !== 'production') {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

app.use(errorHandler);

async function start(): Promise<void> {
  await pool.query('SELECT 1');
  await redis.ping();

  app.listen(env.port, () => {
    log('info', `Backend listening on port ${env.port}`);
  });
}

start().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'startup failed';
  log('error', message);
  process.exit(1);
});
