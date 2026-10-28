import type { PoolClient } from 'pg';

export async function insertWallet(
  client: PoolClient,
  userId: string,
): Promise<void> {
  await client.query('INSERT INTO wallets (user_id) VALUES ($1)', [userId]);
}
