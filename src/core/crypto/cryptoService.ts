import * as Crypto from 'expo-crypto';
import * as ed25519 from '@noble/ed25519';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { stableStringify } from '../utils/json';
import { bytesToHex, hexToBytes } from './bytes';
import type { SignedTransactionPayload } from '../../shared/models/types';

ed25519.hashes.sha512 = sha512;

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export async function createKeyPair(): Promise<KeyPair> {
  const privateKeyBytes = await Crypto.getRandomBytesAsync(32);
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);

  return {
    privateKey: bytesToHex(privateKeyBytes),
    publicKey: bytesToHex(publicKeyBytes),
  };
}

export async function randomNonce(byteLength = 16): Promise<string> {
  return bytesToHex(await Crypto.getRandomBytesAsync(byteLength));
}

export function randomId(prefix: string): string {
  return `${prefix}_${Crypto.randomUUID().replace(/-/g, '')}`;
}

export function hashJson(value: unknown): string {
  return bytesToHex(sha256(utf8ToBytes(stableStringify(value))));
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return bytesToHex(sha256(utf8ToBytes(`${salt}:${pin}`)));
}

export async function signPayload(payload: SignedTransactionPayload, privateKeyHex: string) {
  const bytes = utf8ToBytes(stableStringify(payload));
  const signature = ed25519.sign(bytes, hexToBytes(privateKeyHex));
  return bytesToHex(signature);
}

export async function verifyPayloadSignature(
  payload: SignedTransactionPayload,
  signatureHex: string,
  publicKeyHex: string
) {
  try {
    return ed25519.verify(
      hexToBytes(signatureHex),
      utf8ToBytes(stableStringify(payload)),
      hexToBytes(publicKeyHex)
    );
  } catch {
    return false;
  }
}

export function transactionSignablePayload(input: SignedTransactionPayload): SignedTransactionPayload {
  return {
    transactionId: input.transactionId,
    senderId: input.senderId,
    receiverId: input.receiverId,
    amount: input.amount,
    timestamp: input.timestamp,
    nonce: input.nonce,
    senderPublicKey: input.senderPublicKey,
    receiverPublicKey: input.receiverPublicKey,
  };
}
