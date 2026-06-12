import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Bluetooth, ClipboardCheck, Copy, RotateCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { bluetoothService } from '../bluetooth/bluetoothService';
import { paymentService } from '../payments/paymentService';
import { qrService } from '../qr/qrService';
import { colors } from '../../core/theme/colors';
import type { ReceiveQrPayload, User } from '../../shared/models/types';
import { Button } from '../../shared/widgets/Button';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';

type ReceiveScreenProps = {
  user: User;
  onBack: () => void;
  onAccepted: () => void;
};

export function ReceiveScreen({ user, onBack, onAccepted }: ReceiveScreenProps) {
  const [payload, setPayload] = useState<ReceiveQrPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const qrValue = useMemo(() => (payload ? qrService.encode(payload) : ''), [payload]);

  const regenerate = async () => {
    setPayload(await qrService.createReceivePayload(user));
    await bluetoothService.advertiseReceiveIntent();
  };

  useEffect(() => {
    regenerate();
  }, []);

  const copyQrPayload = async () => {
    if (!qrValue) {
      return;
    }
    await Clipboard.setStringAsync(qrValue);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Receive QR payload copied for testing.');
  };

  const acceptPacket = async () => {
    setLoading(true);
    try {
      const transaction = await bluetoothService.readPacketFromClipboard();
      await paymentService.acceptIncomingTransaction(transaction, user);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Transaction received', 'Signature verified and demo coins stored locally.');
      onAccepted();
    } catch (error) {
      Alert.alert('Could not receive', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Receive" subtitle="Show this QR to the sender nearby." onBack={onBack} />
      <View style={styles.qrCard}>
        <View style={styles.bluetoothPill}>
          <Bluetooth size={14} color={colors.dark} />
          <Text style={styles.bluetoothText}>BLE receive intent active</Text>
        </View>
        <View style={styles.qrBox}>
          {qrValue ? <QRCode value={qrValue} size={240} backgroundColor="#FFFFFF" /> : null}
        </View>
        <Text style={styles.caption}>QR rotates nonce and timestamp. Regenerate before each transfer.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Regenerate"
          variant="secondary"
          icon={<RotateCw size={18} color={colors.ink} />}
          onPress={regenerate}
        />
        <Button
          label="Copy payload"
          variant="secondary"
          icon={<Copy size={18} color={colors.ink} />}
          onPress={copyQrPayload}
        />
        <Button
          label="Accept offline packet"
          icon={<ClipboardCheck size={18} color={colors.dark} />}
          onPress={acceptPacket}
          loading={loading}
        />
      </View>
      <Notice />
      <Pressable onPress={onBack} style={styles.done}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    marginBottom: 18,
  },
  bluetoothPill: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: colors.cyan,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 16,
  },
  bluetoothText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: '900',
  },
  qrBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  caption: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
  },
  actions: {
    gap: 10,
    marginBottom: 18,
  },
  done: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  doneText: {
    color: colors.ink,
    fontWeight: '900',
  },
});
