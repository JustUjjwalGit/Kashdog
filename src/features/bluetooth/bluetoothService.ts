import * as Clipboard from 'expo-clipboard';

import type { Transaction } from '../../shared/models/types';
import { paymentService } from '../payments/paymentService';

export type BluetoothTransferState =
  | 'idle'
  | 'advertising'
  | 'connecting'
  | 'transferring'
  | 'complete'
  | 'retrying'
  | 'failed';

export class BluetoothService {
  async advertiseReceiveIntent() {
    return {
      state: 'advertising' as BluetoothTransferState,
      note: 'Receiver QR is live. Native BLE GATT can plug into this transport boundary.',
    };
  }

  async sendPacket(transaction: Transaction) {
    const packet = paymentService.encodeOfflinePacket(transaction);
    await Clipboard.setStringAsync(packet);

    return {
      state: 'complete' as BluetoothTransferState,
      packet,
      retries: 0,
    };
  }

  async readPacketFromClipboard() {
    const packet = await Clipboard.getStringAsync();
    if (!packet) {
      throw new Error('Clipboard does not contain a KashDog transaction packet.');
    }

    return paymentService.decodeOfflinePacket(packet);
  }
}

export const bluetoothService = new BluetoothService();
