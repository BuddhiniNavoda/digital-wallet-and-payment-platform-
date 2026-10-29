import type { PoolClient } from 'pg';
import { pool } from '../db/postgres';

export type TransactionType = 'deposit' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type HistoryFilter = 'sent' | 'received';

export interface TransactionRow {
  id: string;
  sender_id: string | null;
  receiver_id: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  note: string | null;
  idempotency_key: string | null;
  created_at: Date;
}

const TX_COLUMNS =
  'id, sender_id, receiver_id, amount, type, status, note, idempotency_key, created_at';

export async function insertTransaction(
  client: PoolClient,
  data: {
    senderId: string | null;
    receiverId: string;
    amount: string;
    type: TransactionType;
    status: TransactionStatus;
    note?: string;
  },
): Promise<TransactionRow> {
  const result = await client.query<TransactionRow>(
    `INSERT INTO transactions (sender_id, receiver_id, amount, type, status, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${TX_COLUMNS}`,
    [
      data.senderId,
      data.receiverId,
      data.amount,
      data.type,
      data.status,
      data.note ?? null,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to insert transaction');
  }
  return row;
}

function historyWhere(
  filter: HistoryFilter | undefined,
): { sql: string; params: string[] } {
  if (filter === 'sent') {
    return { sql: 'sender_id = $1', params: [] };
  }
  if (filter === 'received') {
    return { sql: 'receiver_id = $1', params: [] };
  }
  return { sql: '(sender_id = $1 OR receiver_id = $1)', params: [] };
}

export async function listForUser(
  userId: string,
  options: { page: number; limit: number; type?: HistoryFilter },
): Promise<{ rows: TransactionRow[]; total: number }> {
  const { sql } = historyWhere(options.type);
  const offset = (options.page - 1) * options.limit;

  const count = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM transactions WHERE ${sql}`,
    [userId],
  );
  const result = await pool.query<TransactionRow>(
    `SELECT ${TX_COLUMNS}
     FROM transactions
     WHERE ${sql}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, options.limit, offset],
  );

  return {
    rows: result.rows,
    total: Number(count.rows[0]?.count ?? 0),
  };
}
