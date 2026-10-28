import type { PoolClient } from 'pg';
import { pool } from '../db/postgres';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  locked_until: Date | null;
  created_at: Date;
}

const USER_COLUMNS =
  'id, email, password_hash, full_name, locked_until, created_at';

export async function findByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function insertUser(
  client: PoolClient,
  data: { email: string; passwordHash: string; fullName: string },
): Promise<UserRow> {
  const result = await client.query<UserRow>(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash, full_name, locked_until, created_at`,
    [data.email, data.passwordHash, data.fullName],
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error('Failed to insert user');
  }
  return user;
}

export async function lockUntil(userId: string, until: Date): Promise<void> {
  await pool.query('UPDATE users SET locked_until = $1 WHERE id = $2', [
    until,
    userId,
  ]);
}
