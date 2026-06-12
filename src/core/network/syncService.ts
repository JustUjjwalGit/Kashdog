import * as Network from 'expo-network';

import { SYNC_ENDPOINT_STORAGE_KEY } from '../constants/app';
import { hashJson, transactionSignablePayload, verifyPayloadSignature } from '../crypto/cryptoService';
import { kashdogRepository } from '../database/kashdogRepository';
import type { SyncResult, Transaction, User } from '../../shared/models/types';
import { getDefaultSyncEndpoint, isInvalidMobileSyncEndpoint } from './defaultEndpoint';

const SYNC_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Could not reach the sync backend. Check that the Backend URL is your laptop IP, for example ${getDefaultSyncEndpoint()}.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export class SyncService {
  async getEndpoint() {
    const storedEndpoint = await kashdogRepository.getMeta(SYNC_ENDPOINT_STORAGE_KEY);
    if (storedEndpoint && !isInvalidMobileSyncEndpoint(storedEndpoint)) {
      return storedEndpoint;
    }

    return getDefaultSyncEndpoint();
  }

  async setEndpoint(endpoint: string) {
    const normalized = endpoint.trim().replace(/\/$/, '');
    await kashdogRepository.setMeta(SYNC_ENDPOINT_STORAGE_KEY, normalized);
  }

  async sync(user: User): Promise<SyncResult> {
    const network = await Network.getNetworkStateAsync();
    if (network.isInternetReachable === false) {
      throw new Error('No internet connection available for sync.');
    }

    const endpoint = (await this.getEndpoint()).replace(/\/$/, '');
    if (isInvalidMobileSyncEndpoint(endpoint)) {
      throw new Error(
        `Backend URL is not reachable from your phone. Set it to your laptop IP, for example ${getDefaultSyncEndpoint()}.`
      );
    }

    const localTransactions = await kashdogRepository.getTransactions(500);

    const pushResponse = await fetchWithTimeout(`${endpoint}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, transactions: localTransactions }),
    });

    if (!pushResponse.ok) {
      throw new Error(`Push failed with status ${pushResponse.status}.`);
    }

    const pushed = (await pushResponse.json()) as { accepted: string[] };
    await kashdogRepository.markTransactionsSynced(pushed.accepted ?? []);

    const pullResponse = await fetchWithTimeout(
      `${endpoint}/api/sync/pull?userId=${encodeURIComponent(user.id)}`
    );
    if (!pullResponse.ok) {
      throw new Error(`Pull failed with status ${pullResponse.status}.`);
    }

    const pulled = (await pullResponse.json()) as { transactions: Transaction[] };
    let verified = 0;
    for (const transaction of pulled.transactions ?? []) {
      if (transaction.receiverId !== user.id && transaction.senderId !== user.id) {
        continue;
      }

      const signable = transactionSignablePayload(transaction);
      const signatureOk = await verifyPayloadSignature(
        signable,
        transaction.signature,
        transaction.senderPublicKey
      );
      const hashOk = hashJson({ ...signable, signature: transaction.signature }) === transaction.hash;

      if (signatureOk && hashOk) {
        verified += 1;
        const existing = await kashdogRepository.getTransactionById(transaction.transactionId);
        const syncedTransaction: Transaction = {
          ...transaction,
          direction: transaction.senderId === user.id ? 'sent' : 'received',
          status: 'synced',
          syncedAt: Date.now(),
        };

        if (!existing) {
          if (syncedTransaction.direction === 'received') {
            await kashdogRepository.applyLocalTransaction(syncedTransaction);
          } else {
            await kashdogRepository.saveTransaction(syncedTransaction);
          }
        } else {
          await kashdogRepository.saveTransaction(syncedTransaction);
        }
      }
    }

    await kashdogRepository.reconcileWalletBalance(user.id);

    return {
      pushed: pushed.accepted?.length ?? 0,
      pulled: pulled.transactions?.length ?? 0,
      verified,
    };
  }
}

export const syncService = new SyncService();
