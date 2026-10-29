import { pool } from '../db/postgres';
import { AppError } from '../lib/errors';
import { formatMoney, moneyNumber } from '../lib/money';
import * as transactionModel from '../models/transactionModel';
import * as userModel from '../models/userModel';
import * as walletModel from '../models/walletModel';
import type { HistoryQuery } from '../validation/transactionSchemas';
import type { TransactionRow } from '../models/transactionModel';

export interface PublicTransaction {
  id: string;
  senderId: string | null;
  receiverId: string;
  amount: string;
  type: string;
  status: string;
  note: string | null;
  createdAt: Date;
}

export function toPublicTransaction(row: TransactionRow): PublicTransaction {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    amount: formatMoney(row.amount),
    type: row.type,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function sendMoney(
  senderId: string,
  input: { toEmail: string; amount: number; note?: string },
): Promise<PublicTransaction> {
  if (input.toEmail.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Receiver email is required.', 400);
  }

  const receiver = await userModel.findByEmail(input.toEmail);
  if (!receiver) {
    throw new AppError(
      'RECEIVER_NOT_FOUND',
      'No user exists with that email.',
      404,
    );
  }

  if (senderId === receiver.id) {
    throw new AppError(
      'SELF_TRANSFER',
      'You cannot send money to yourself.',
      400,
    );
  }

  const amountStr = formatMoney(input.amount);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock wallets in a stable order so A→B and B→A cannot deadlock.
    const firstId = senderId < receiver.id ? senderId : receiver.id;
    const secondId = senderId < receiver.id ? receiver.id : senderId;
    const first = await walletModel.findByUserIdForUpdate(client, firstId);
    const second = await walletModel.findByUserIdForUpdate(client, secondId);
    const senderWallet = first?.user_id === senderId ? first : second;
    const receiverWallet = first?.user_id === receiver.id ? first : second;

    if (!senderWallet || !receiverWallet) {
      throw new AppError('WALLET_NOT_FOUND', 'Wallet was not found.', 404);
    }
    if (senderWallet.frozen || receiverWallet.frozen) {
      throw new AppError(
        'WALLET_FROZEN',
        'A frozen wallet cannot take part in this transfer.',
        403,
      );
    }
    if (moneyNumber(senderWallet.balance) < input.amount) {
      throw new AppError(
        'INSUFFICIENT_FUNDS',
        'Your wallet balance is too low for this transfer.',
        400,
      );
    }

    await walletModel.subtractBalance(client, senderId, amountStr);
    await walletModel.addBalance(client, receiver.id, amountStr);
    const row = await transactionModel.insertTransaction(client, {
      senderId,
      receiverId: receiver.id,
      amount: amountStr,
      type: 'transfer',
      status: 'completed',
      note: input.note,
    });

    await client.query('COMMIT');
    return toPublicTransaction(row);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getHistory(userId: string, query: HistoryQuery) {
  const { rows, total } = await transactionModel.listForUser(userId, {
    page: query.page,
    limit: query.limit,
    type: query.type,
  });

  return {
    page: query.page,
    limit: query.limit,
    total,
    transactions: rows.map(toPublicTransaction),
  };
}
