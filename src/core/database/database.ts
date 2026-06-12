import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME } from '../constants/app';

let databasePromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          public_key TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS wallets (
          user_id TEXT PRIMARY KEY NOT NULL,
          balance REAL NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transactions (
          transaction_id TEXT PRIMARY KEY NOT NULL,
          sender_id TEXT NOT NULL,
          receiver_id TEXT NOT NULL,
          amount REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          nonce TEXT NOT NULL,
          status TEXT NOT NULL,
          signature TEXT NOT NULL,
          hash TEXT NOT NULL,
          sender_public_key TEXT NOT NULL,
          receiver_public_key TEXT NOT NULL,
          direction TEXT NOT NULL,
          synced_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);

      return db;
    });
  }

  return databasePromise;
}
