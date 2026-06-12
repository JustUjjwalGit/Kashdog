import {
  hashJson,
  randomId,
  randomNonce,
  signPayload,
  transactionSignablePayload,
  verifyPayloadSignature,
} from '../../core/crypto/cryptoService';
import { kashdogRepository } from '../../core/database/kashdogRepository';
import { secureStorageService } from '../../core/services/secureStorageService';
import type { ReceiveQrPayload, SignedTransactionPayload, Transaction, User } from '../../shared/models/types';

export class PaymentService {
  async createOutgoingTransaction(user: User, receiver: ReceiveQrPayload, amount: number) {
    if (receiver.receiverId === user.id) {
      throw new Error('You cannot send demo coins to your own wallet.');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid amount.');
    }

    const wallet = await kashdogRepository.getWallet(user.id);
    if (!wallet) {
      throw new Error('Wallet not found.');
    }
    if (wallet.balance < amount) {
      throw new Error('Insufficient demo balance.');
    }

    const privateKey = await secureStorageService.getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key is missing from secure storage.');
    }

    const payload = transactionSignablePayload({
      transactionId: randomId('txn'),
      senderId: user.id,
      receiverId: receiver.receiverId,
      amount,
      timestamp: Date.now(),
      nonce: await randomNonce(),
      senderPublicKey: user.publicKey,
      receiverPublicKey: receiver.publicKey,
    });
    const signature = await signPayload(payload, privateKey);
    const hash = hashJson({ ...payload, signature });

    const transaction: Transaction = {
      ...payload,
      status: 'pending',
      signature,
      hash,
      direction: 'sent',
      syncedAt: null,
    };

    await kashdogRepository.applyLocalTransaction(transaction);
    return transaction;
  }

  async acceptIncomingTransaction(transaction: Transaction, currentUser: User) {
    if (transaction.receiverId !== currentUser.id) {
      throw new Error('This transaction is for another wallet.');
    }

    const signable: SignedTransactionPayload = transactionSignablePayload(transaction);
    const verified = await verifyPayloadSignature(
      signable,
      transaction.signature,
      transaction.senderPublicKey
    );

    if (!verified) {
      throw new Error('Transaction signature could not be verified.');
    }

    const expectedHash = hashJson({ ...signable, signature: transaction.signature });
    if (expectedHash !== transaction.hash) {
      throw new Error('Transaction hash mismatch.');
    }

    const receivedTransaction: Transaction = {
      ...transaction,
      status: 'received',
      direction: 'received',
      syncedAt: null,
    };

    await kashdogRepository.applyLocalTransaction(receivedTransaction);
    return receivedTransaction;
  }

  encodeOfflinePacket(transaction: Transaction) {
    return JSON.stringify({
      app: 'KashDog',
      version: 1,
      type: 'transaction_packet',
      transaction,
    });
  }

  decodeOfflinePacket(value: string): Transaction {
    const parsed = JSON.parse(value) as {
      app?: string;
      version?: number;
      type?: string;
      transaction?: Transaction;
    };

    if (parsed.app !== 'KashDog' || parsed.version !== 1 || parsed.type !== 'transaction_packet') {
      throw new Error('This is not a KashDog transaction packet.');
    }

    if (!parsed.transaction?.transactionId || !parsed.transaction.signature) {
      throw new Error('Transaction packet is incomplete.');
    }

    return parsed.transaction;
  }
}

export const paymentService = new PaymentService();
