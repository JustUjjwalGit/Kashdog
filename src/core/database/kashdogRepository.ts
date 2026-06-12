import { DEMO_STARTING_BALANCE } from '../constants/app';
import type { Transaction, User, Wallet } from '../../shared/models/types';
import { getDatabase } from './database';

type UserRow = {
  id: string;
  name: string;
  username: string;
  public_key: string;
  created_at: number;
};

type WalletRow = {
  user_id: string;
  balance: number;
  updated_at: number;
};

type TransactionRow = {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: number;
  nonce: string;
  status: Transaction['status'];
  signature: string;
  hash: string;
  sender_public_key: string;
  receiver_public_key: string;
  direction: Transaction['direction'];
  synced_at: number | null;
};

const userFromRow = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  username: row.username,
  publicKey: row.public_key,
  createdAt: row.created_at,
});

const walletFromRow = (row: WalletRow): Wallet => ({
  userId: row.user_id,
  balance: row.balance,
  updatedAt: row.updated_at,
});

const transactionFromRow = (row: TransactionRow): Transaction => ({
  transactionId: row.transaction_id,
  senderId: row.sender_id,
  receiverId: row.receiver_id,
  amount: row.amount,
  timestamp: row.timestamp,
  nonce: row.nonce,
  status: row.status,
  signature: row.signature,
  hash: row.hash,
  senderPublicKey: row.sender_public_key,
  receiverPublicKey: row.receiver_public_key,
  direction: row.direction,
  syncedAt: row.synced_at,
});

export class KashdogRepository {
  async createUserWithWallet(user: User, wallet: Wallet) {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO users (id, name, username, public_key, created_at) VALUES (?, ?, ?, ?, ?)`,
        user.id,
        user.name,
        user.username,
        user.publicKey,
        user.createdAt
      );
      await db.runAsync(
        `INSERT INTO wallets (user_id, balance, updated_at) VALUES (?, ?, ?)`,
        wallet.userId,
        wallet.balance,
        wallet.updatedAt
      );
    });
  }

  async getCurrentUser(): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<UserRow>(`SELECT * FROM users ORDER BY created_at DESC LIMIT 1`);
    return row ? userFromRow(row) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<UserRow>(`SELECT * FROM users WHERE id = ? LIMIT 1`, id);
    return row ? userFromRow(row) : null;
  }

  async getWallet(userId: string): Promise<Wallet | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WalletRow>(`SELECT * FROM wallets WHERE user_id = ?`, userId);
    return row ? walletFromRow(row) : null;
  }

  async upsertWallet(wallet: Wallet) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO wallets (user_id, balance, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET balance = excluded.balance, updated_at = excluded.updated_at`,
      wallet.userId,
      wallet.balance,
      wallet.updatedAt
    );
  }

  async getTransactions(limit = 100): Promise<Transaction[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TransactionRow>(
      `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?`,
      limit
    );
    return rows.map(transactionFromRow);
  }

  async getRecentTransactions(limit = 5): Promise<Transaction[]> {
    return this.getTransactions(limit);
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TransactionRow>(
      `SELECT * FROM transactions WHERE transaction_id = ? LIMIT 1`,
      transactionId
    );
    return row ? transactionFromRow(row) : null;
  }

  async saveTransaction(transaction: Transaction) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO transactions (
        transaction_id, sender_id, receiver_id, amount, timestamp, nonce, status, signature, hash,
        sender_public_key, receiver_public_key, direction, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(transaction_id) DO UPDATE SET
        status = excluded.status,
        synced_at = excluded.synced_at`,
      transaction.transactionId,
      transaction.senderId,
      transaction.receiverId,
      transaction.amount,
      transaction.timestamp,
      transaction.nonce,
      transaction.status,
      transaction.signature,
      transaction.hash,
      transaction.senderPublicKey,
      transaction.receiverPublicKey,
      transaction.direction,
      transaction.syncedAt ?? null
    );
  }

  async applyLocalTransaction(transaction: Transaction) {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      const existing = await db.getFirstAsync<TransactionRow>(
        `SELECT * FROM transactions WHERE transaction_id = ? LIMIT 1`,
        transaction.transactionId
      );

      if (existing) {
        return;
      }

      const currentWallet = await db.getFirstAsync<WalletRow>(
        `SELECT * FROM wallets WHERE user_id = ?`,
        transaction.direction === 'sent' ? transaction.senderId : transaction.receiverId
      );

      if (!currentWallet) {
        throw new Error('Wallet not found.');
      }

      const nextBalance =
        transaction.direction === 'sent'
          ? currentWallet.balance - transaction.amount
          : currentWallet.balance + transaction.amount;

      if (nextBalance < 0) {
        throw new Error('Insufficient demo balance.');
      }

      await db.runAsync(
        `UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`,
        nextBalance,
        Date.now(),
        currentWallet.user_id
      );

      await db.runAsync(
        `INSERT INTO transactions (
          transaction_id, sender_id, receiver_id, amount, timestamp, nonce, status, signature, hash,
          sender_public_key, receiver_public_key, direction, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction.transactionId,
        transaction.senderId,
        transaction.receiverId,
        transaction.amount,
        transaction.timestamp,
        transaction.nonce,
        transaction.status,
        transaction.signature,
        transaction.hash,
        transaction.senderPublicKey,
        transaction.receiverPublicKey,
        transaction.direction,
        transaction.syncedAt ?? null
      );
    });
  }

  async getPendingSyncTransactions(): Promise<Transaction[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TransactionRow>(
      `SELECT * FROM transactions WHERE synced_at IS NULL ORDER BY timestamp ASC`
    );
    return rows.map(transactionFromRow);
  }

  async markTransactionsSynced(transactionIds: string[]) {
    if (transactionIds.length === 0) {
      return;
    }

    const db = await getDatabase();
    const syncedAt = Date.now();
    await db.withTransactionAsync(async () => {
      for (const transactionId of transactionIds) {
        await db.runAsync(
          `UPDATE transactions SET status = 'synced', synced_at = ? WHERE transaction_id = ?`,
          syncedAt,
          transactionId
        );
      }
    });
  }

  async reconcileWalletBalance(userId: string) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ sent: number | null; received: number | null }>(
      `
        SELECT
          SUM(CASE WHEN sender_id = ? THEN amount ELSE 0 END) AS sent,
          SUM(CASE WHEN receiver_id = ? THEN amount ELSE 0 END) AS received
        FROM transactions
        WHERE sender_id = ? OR receiver_id = ?
      `,
      userId,
      userId,
      userId,
      userId
    );

    const balance = DEMO_STARTING_BALANCE - (row?.sent ?? 0) + (row?.received ?? 0);
    await db.runAsync(
      `UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?`,
      balance,
      Date.now(),
      userId
    );

    return balance;
  }

  async setMeta(key: string, value: string) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
  }

  async getMeta(key: string): Promise<string | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_meta WHERE key = ? LIMIT 1`,
      key
    );
    return row?.value ?? null;
  }

  async clearAll() {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM transactions`);
      await db.runAsync(`DELETE FROM wallets`);
      await db.runAsync(`DELETE FROM users`);
      await db.runAsync(`DELETE FROM app_meta`);
    });
  }
}

export const kashdogRepository = new KashdogRepository();
