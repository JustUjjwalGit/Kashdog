import * as SecureStore from 'expo-secure-store';

const PRIVATE_KEY_KEY = 'kashdog.privateKey';
const PIN_HASH_KEY = 'kashdog.pinHash';
const PIN_SALT_KEY = 'kashdog.pinSalt';

export class SecureStorageService {
  async savePrivateKey(privateKey: string) {
    await SecureStore.setItemAsync(PRIVATE_KEY_KEY, privateKey, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async getPrivateKey() {
    return SecureStore.getItemAsync(PRIVATE_KEY_KEY);
  }

  async savePinHash(pinHash: string, salt: string) {
    await SecureStore.setItemAsync(PIN_HASH_KEY, pinHash, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async getPinMaterial() {
    const [pinHash, salt] = await Promise.all([
      SecureStore.getItemAsync(PIN_HASH_KEY),
      SecureStore.getItemAsync(PIN_SALT_KEY),
    ]);

    return pinHash && salt ? { pinHash, salt } : null;
  }

  async clear() {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(PRIVATE_KEY_KEY),
      SecureStore.deleteItemAsync(PIN_HASH_KEY),
      SecureStore.deleteItemAsync(PIN_SALT_KEY),
    ]);
  }
}

export const secureStorageService = new SecureStorageService();
