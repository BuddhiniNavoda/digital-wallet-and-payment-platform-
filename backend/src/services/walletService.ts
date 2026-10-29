import { pool } from '../db/postgres';
import { AppError } from '../lib/errors';
import { formatMoney } from '../lib/money';
import * as transactionModel from '../models/transactionModel';
import * as walletModel from '../models/walletModel';
import type { WalletRow } from '../models/walletModel';
import type { TransactionRow } from '../models/transactionModel';

export interface PublicWallet {
  balance: string;
  currency: string;
  frozen: boolean;
}

function toPublicWallet(wallet: WalletRow): PublicWallet {
  return {
    balance: formatMoney(wallet.balance),
    currency: wallet.currency,
    frozen: wallet.frozen,
  };
}

export async function getBalance(userId: string): Promise<PublicWallet> {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    throw new AppError('WALLET_NOT_FOUND', 'Wallet was not found.', 404);
  }
  return toPublicWallet(wallet);
}

export async function deposit(
  userId: string,
  amount: number,
): Promise<{ wallet: PublicWallet; transaction: TransactionRow }> {
  const amountStr = formatMoney(amount);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const wallet = await walletModel.findByUserIdForUpdate(client, userId);
    if (!wallet) {
      throw new AppError('WALLET_NOT_FOUND', 'Wallet was not found.', 404);
    }
    if (wallet.frozen) {
      throw new AppError(
        'WALLET_FROZEN',
        'This wallet is frozen and cannot receive deposits.',
        403,
      );
    }

    const updated = await walletModel.addBalance(client, userId, amountStr);
    const transaction = await transactionModel.insertTransaction(client, {
      senderId: null,
      receiverId: userId,
      amount: amountStr,
      type: 'deposit',
      status: 'completed',
    });

    await client.query('COMMIT');
    return { wallet: toPublicWallet(updated), transaction };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

