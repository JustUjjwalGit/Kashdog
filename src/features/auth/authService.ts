import * as LocalAuthentication from 'expo-local-authentication';

import { DEMO_STARTING_BALANCE } from '../../core/constants/app';
import { createKeyPair, hashPin, randomId, randomNonce } from '../../core/crypto/cryptoService';
import { kashdogRepository } from '../../core/database/kashdogRepository';
import { secureStorageService } from '../../core/services/secureStorageService';
import type { User, Wallet } from '../../shared/models/types';

export class AuthService {
  async hasAccount() {
    return Boolean(await kashdogRepository.getCurrentUser());
  }

  async register(input: { name: string; username: string; pin: string }) {
    if (input.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters.');
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(input.username.trim())) {
      throw new Error('Username must be 3-20 characters and use letters, numbers, or underscore.');
    }
    if (!/^\d{4,8}$/.test(input.pin)) {
      throw new Error('PIN must be 4-8 digits.');
    }

    const keys = await createKeyPair();
    const createdAt = Date.now();
    const user: User = {
      id: randomId('usr'),
      name: input.name.trim(),
      username: input.username.trim().toLowerCase(),
      publicKey: keys.publicKey,
      createdAt,
    };
    const wallet: Wallet = {
      userId: user.id,
      balance: DEMO_STARTING_BALANCE,
      updatedAt: createdAt,
    };

    const salt = await randomNonce(16);
    const pinHash = await hashPin(input.pin, salt);

    await kashdogRepository.createUserWithWallet(user, wallet);
    await secureStorageService.savePrivateKey(keys.privateKey);
    await secureStorageService.savePinHash(pinHash, salt);

    return { user, wallet };
  }

  async verifyPin(pin: string) {
    const material = await secureStorageService.getPinMaterial();
    if (!material) {
      return false;
    }

    const candidate = await hashPin(pin, material.salt);
    return candidate === material.pinHash;
  }

  async authenticateWithBiometric() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) {
      throw new Error('Biometric authentication is not enrolled on this device.');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock KashDog',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  async resetPrototype() {
    await secureStorageService.clear();
    await kashdogRepository.clearAll();
  }
}

export const authService = new AuthService();
