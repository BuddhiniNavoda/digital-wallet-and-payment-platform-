import type { PoolClient } from 'pg';
import { pool } from '../db/postgres';

export interface WalletRow {
  id: string;
  user_id: string;
  balance: string;
  currency: string;
  frozen: boolean;
  updated_at: Date;
}

const WALLET_COLUMNS =
  'id, user_id, balance, currency, frozen, updated_at';

export async function insertWallet(
  client: PoolClient,
  userId: string,
): Promise<void> {
  await client.query('INSERT INTO wallets (user_id) VALUES ($1)', [userId]);
}

export async function findByUserId(userId: string): Promise<WalletRow | null> {
  const result = await pool.query<WalletRow>(
    `SELECT ${WALLET_COLUMNS} FROM wallets WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function findByUserIdForUpdate(
  client: PoolClient,
  userId: string,
): Promise<WalletRow | null> {
  const result = await client.query<WalletRow>(
    `SELECT ${WALLET_COLUMNS} FROM wallets WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function addBalance(
  client: PoolClient,
  userId: string,
  amount: string,
): Promise<WalletRow> {
  const result = await client.query<WalletRow>(
    `UPDATE wallets SET balance = balance + $1
     WHERE user_id = $2
     RETURNING ${WALLET_COLUMNS}`,
    [amount, userId],
  );
  const wallet = result.rows[0];
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  return wallet;
}

export async function subtractBalance(
  client: PoolClient,
  userId: string,
  amount: string,
): Promise<WalletRow> {
  const result = await client.query<WalletRow>(
    `UPDATE wallets SET balance = balance - $1
     WHERE user_id = $2
     RETURNING ${WALLET_COLUMNS}`,
    [amount, userId],
  );
  const wallet = result.rows[0];
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  return wallet;
}
