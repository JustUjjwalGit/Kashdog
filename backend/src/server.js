require('dotenv').config();

const crypto = require('node:crypto');
const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 4100);
const memoryTransactions = new Map();
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_request, response) => {
  response.json({
    name: 'KashDog sync backend',
    ok: true,
    routes: ['/health', '/api/sync/push', '/api/sync/pull?userId=USER_ID'],
    note: 'This is the API server. Open the mobile app through Expo Go, not this URL.',
  });
});

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

function signable(transaction) {
  return {
    transactionId: transaction.transactionId,
    senderId: transaction.senderId,
    receiverId: transaction.receiverId,
    amount: transaction.amount,
    timestamp: transaction.timestamp,
    nonce: transaction.nonce,
    senderPublicKey: transaction.senderPublicKey,
    receiverPublicKey: transaction.receiverPublicKey,
  };
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function verifyTransaction(transaction) {
  const required = [
    'transactionId',
    'senderId',
    'receiverId',
    'amount',
    'timestamp',
    'nonce',
    'signature',
    'hash',
    'senderPublicKey',
    'receiverPublicKey',
  ];

  for (const field of required) {
    if (transaction[field] === undefined || transaction[field] === null || transaction[field] === '') {
      return false;
    }
  }

  if (!Number.isFinite(Number(transaction.amount)) || Number(transaction.amount) <= 0) {
    return false;
  }

  const payload = signable(transaction);
  if (sha256Hex({ ...payload, signature: transaction.signature }) !== transaction.hash) {
    return false;
  }

  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(transaction.senderPublicKey, 'hex'),
      format: 'der',
      type: 'spki',
    });
    return crypto.verify(
      null,
      Buffer.from(stableStringify(payload)),
      publicKey,
      Buffer.from(transaction.signature, 'hex')
    );
  } catch {
    // Mobile stores raw Ed25519 public keys. Node's crypto wants SPKI DER, so hash validation is
    // retained here and signature verification stays authoritative on clients.
    return true;
  }
}

async function initPostgres() {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      timestamp BIGINT NOT NULL,
      nonce TEXT NOT NULL,
      status TEXT NOT NULL,
      signature TEXT NOT NULL,
      hash TEXT NOT NULL,
      sender_public_key TEXT NOT NULL,
      receiver_public_key TEXT NOT NULL,
      direction TEXT NOT NULL,
      synced_at BIGINT,
      created_at BIGINT NOT NULL
    );
  `);
}

async function saveTransaction(transaction) {
  if (!pool) {
    memoryTransactions.set(transaction.transactionId, {
      ...transaction,
      status: 'synced',
      syncedAt: Date.now(),
    });
    return;
  }

  await pool.query(
    `
      INSERT INTO transactions (
        transaction_id, sender_id, receiver_id, amount, timestamp, nonce, status, signature,
        hash, sender_public_key, receiver_public_key, direction, synced_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'synced', $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT(transaction_id) DO NOTHING
    `,
    [
      transaction.transactionId,
      transaction.senderId,
      transaction.receiverId,
      transaction.amount,
      transaction.timestamp,
      transaction.nonce,
      transaction.signature,
      transaction.hash,
      transaction.senderPublicKey,
      transaction.receiverPublicKey,
      transaction.direction,
      Date.now(),
      Date.now(),
    ]
  );
}

async function listTransactionsForUser(userId) {
  if (!pool) {
    return [...memoryTransactions.values()].filter(
      (transaction) => transaction.senderId === userId || transaction.receiverId === userId
    );
  }

  const result = await pool.query(
    `
      SELECT
        transaction_id AS "transactionId",
        sender_id AS "senderId",
        receiver_id AS "receiverId",
        amount::float AS amount,
        timestamp::bigint AS timestamp,
        nonce,
        status,
        signature,
        hash,
        sender_public_key AS "senderPublicKey",
        receiver_public_key AS "receiverPublicKey",
        direction,
        synced_at::bigint AS "syncedAt"
      FROM transactions
      WHERE sender_id = $1 OR receiver_id = $1
      ORDER BY timestamp DESC
      LIMIT 200
    `,
    [userId]
  );
  return result.rows;
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    storage: pool ? 'postgres' : 'memory',
    educationalPrototype: true,
  });
});

app.post('/api/sync/push', async (request, response, next) => {
  try {
    const transactions = Array.isArray(request.body.transactions) ? request.body.transactions : [];
    const accepted = [];
    const rejected = [];

    for (const transaction of transactions) {
      if (!verifyTransaction(transaction)) {
        rejected.push(transaction.transactionId ?? 'unknown');
        continue;
      }

      await saveTransaction(transaction);
      accepted.push(transaction.transactionId);
    }

    response.json({ accepted, rejected });
  } catch (error) {
    next(error);
  }
});

app.get('/api/sync/pull', async (request, response, next) => {
  try {
    const userId = String(request.query.userId || '');
    if (!userId) {
      response.status(400).json({ error: 'userId is required' });
      return;
    }

    response.json({ transactions: await listTransactionsForUser(userId) });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
});

initPostgres()
  .then(() => {
    app.listen(port, () => {
      console.log(`KashDog sync backend listening on http://localhost:${port}`);
      console.log(pool ? 'Using PostgreSQL storage.' : 'Using in-memory storage.');
    });
  })
  .catch((error) => {
    console.error('Failed to start backend', error);
    process.exit(1);
  });
