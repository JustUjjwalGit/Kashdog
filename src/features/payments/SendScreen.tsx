import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Bluetooth, Camera, ClipboardPaste, SendHorizontal } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { bluetoothService } from '../bluetooth/bluetoothService';
import { paymentService } from './paymentService';
import { qrService } from '../qr/qrService';
import { colors } from '../../core/theme/colors';
import { compactId, formatCoins } from '../../core/utils/format';
import type { ReceiveQrPayload, User, Wallet } from '../../shared/models/types';
import { Button } from '../../shared/widgets/Button';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';
import { TextField } from '../../shared/widgets/TextField';

type SendScreenProps = {
  user: User;
  wallet: Wallet;
  onBack: () => void;
  onSent: () => void;
};

export function SendScreen({ user, wallet, onBack, onSent }: SendScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [receiver, setReceiver] = useState<ReceiveQrPayload | null>(null);
  const [amount, setAmount] = useState('');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const setReceiverFromQr = async (value: string) => {
    try {
      const nextReceiver = qrService.decode(value);
      setReceiver(nextReceiver);
      setScanned(true);
      await Haptics.selectionAsync();
    } catch (error) {
      Alert.alert('Invalid QR', error instanceof Error ? error.message : 'Scan a KashDog receive QR.');
    }
  };

  const pastePayload = async () => {
    const value = await Clipboard.getStringAsync();
    if (!value) {
      Alert.alert('Clipboard empty', 'Copy a KashDog receive payload first.');
      return;
    }
    await setReceiverFromQr(value);
  };

  const send = async () => {
    if (!receiver) {
      Alert.alert('Scan receiver', 'Scan or paste a receive QR before sending.');
      return;
    }

    const parsedAmount = Number(amount);
    setLoading(true);
    try {
      const transaction = await paymentService.createOutgoingTransaction(user, receiver, parsedAmount);
      await bluetoothService.sendPacket(transaction);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Offline packet ready',
        'Transaction is signed, stored locally, and copied as the BLE packet simulation.'
      );
      onSent();
    } catch (error) {
      Alert.alert('Could not send', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const cameraGranted = permission?.granted;

  return (
    <Screen>
      <Header title="Send" subtitle={`Available: ${formatCoins(wallet.balance)}`} onBack={onBack} />
      <View style={styles.scanner}>
        {cameraGranted ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              scanned
                ? undefined
                : (result) => {
                    setReceiverFromQr(result.data);
                  }
            }
          />
        ) : (
          <View style={styles.cameraFallback}>
            <Camera size={42} color={colors.dark} />
            <Text style={styles.cameraText}>Camera permission is needed to scan receive QRs.</Text>
            <Button label="Allow camera" onPress={requestPermission} />
          </View>
        )}
        <View style={styles.scanFrame} pointerEvents="none" />
      </View>

      <View style={styles.receiverCard}>
        <Text style={styles.label}>Receiver</Text>
        <Text style={styles.receiverText}>
          {receiver ? compactId(receiver.receiverId, 12, 8) : 'No receiver scanned'}
        </Text>
        {receiver ? (
          <Pressable onPress={() => setScanned(false)} style={styles.rescan}>
            <Text style={styles.rescanText}>Scan again</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.form}>
        <TextField
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
        />
        <Button
          label="Paste receive payload"
          variant="secondary"
          icon={<ClipboardPaste size={18} color={colors.ink} />}
          onPress={pastePayload}
        />
        <Button
          label="Sign and transfer"
          icon={<SendHorizontal size={18} color={colors.dark} />}
          onPress={send}
          loading={loading}
        />
      </View>

      <View style={styles.bleNote}>
        <Bluetooth size={18} color={colors.dark} />
        <Text style={styles.bleText}>
          Expo build uses clipboard as the test transport. The packet boundary is ready for native BLE.
        </Text>
      </View>
      <Notice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scanner: {
    height: 280,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.dark,
    marginBottom: 14,
  },
  camera: {
    flex: 1,
  },
  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
    backgroundColor: colors.cyan,
  },
  cameraText: {
    color: colors.dark,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  scanFrame: {
    position: 'absolute',
    top: 52,
    left: 52,
    right: 52,
    bottom: 52,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.lime,
  },
  receiverCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  receiverText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  rescan: {
    marginTop: 10,
  },
  rescanText: {
    color: colors.blue,
    fontWeight: '900',
  },
  form: {
    gap: 10,
    marginBottom: 14,
  },
  bleNote: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 8,
    backgroundColor: colors.mint,
    padding: 12,
    marginBottom: 14,
  },
  bleText: {
    flex: 1,
    color: colors.dark,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
});
