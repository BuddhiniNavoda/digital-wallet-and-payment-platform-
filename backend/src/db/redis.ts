import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  maxRetriesPerRequest: 3,
});
