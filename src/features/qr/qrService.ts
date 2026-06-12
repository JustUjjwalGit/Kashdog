import { QR_TTL_MS } from '../../core/constants/app';
import { randomNonce } from '../../core/crypto/cryptoService';
import { safeJsonParse } from '../../core/utils/json';
import type { ReceiveQrPayload, User } from '../../shared/models/types';

export class QrService {
  async createReceivePayload(user: User): Promise<ReceiveQrPayload> {
    return {
      app: 'KashDog',
      version: 1,
      type: 'receive',
      receiverId: user.id,
      publicKey: user.publicKey,
      timestamp: Date.now(),
      nonce: await randomNonce(),
    };
  }

  encode(payload: ReceiveQrPayload) {
    return JSON.stringify(payload);
  }

  decode(value: string): ReceiveQrPayload {
    const parsed = safeJsonParse<ReceiveQrPayload>(value);
    if (!parsed || parsed.app !== 'KashDog' || parsed.type !== 'receive' || parsed.version !== 1) {
      throw new Error('This is not a KashDog receive QR.');
    }

    if (!parsed.receiverId || !parsed.publicKey || !parsed.timestamp || !parsed.nonce) {
      throw new Error('QR payload is missing payment fields.');
    }

    if (Date.now() - parsed.timestamp > QR_TTL_MS) {
      throw new Error('This receive QR has expired. Ask the receiver to regenerate it.');
    }

    return parsed;
  }
}

export const qrService = new QrService();
