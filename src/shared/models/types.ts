export type TransactionStatus = 'pending' | 'received' | 'synced' | 'failed';

export type TransactionDirection = 'sent' | 'received';

export type User = {
  id: string;
  name: string;
  username: string;
  publicKey: string;
  createdAt: number;
};

export type Wallet = {
  userId: string;
  balance: number;
  updatedAt: number;
};

export type Transaction = {
  transactionId: string;
  senderId: string;
  receiverId: string;
  amount: number;
  timestamp: number;
  nonce: string;
  status: TransactionStatus;
  signature: string;
  hash: string;
  senderPublicKey: string;
  receiverPublicKey: string;
  direction: TransactionDirection;
  syncedAt?: number | null;
};

export type ReceiveQrPayload = {
  app: 'KashDog';
  version: 1;
  type: 'receive';
  receiverId: string;
  publicKey: string;
  timestamp: number;
  nonce: string;
};

export type SignedTransactionPayload = {
  transactionId: string;
  senderId: string;
  receiverId: string;
  amount: number;
  timestamp: number;
  nonce: string;
  senderPublicKey: string;
  receiverPublicKey: string;
};

export type AppRoute =
  | 'onboarding'
  | 'register'
  | 'login'
  | 'home'
  | 'send'
  | 'receive'
  | 'history'
  | 'sync'
  | 'profile'
  | 'settings';

export type SyncResult = {
  pushed: number;
  pulled: number;
  verified: number;
};
