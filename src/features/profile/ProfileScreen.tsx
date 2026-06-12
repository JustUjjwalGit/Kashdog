import { Alert, StyleSheet, Text, View } from 'react-native';
import { Clipboard, Copy, KeyRound, UserRound } from 'lucide-react-native';
import * as ExpoClipboard from 'expo-clipboard';

import { colors } from '../../core/theme/colors';
import { compactId, formatCoins } from '../../core/utils/format';
import type { User, Wallet } from '../../shared/models/types';
import { Button } from '../../shared/widgets/Button';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';

type ProfileScreenProps = {
  user: User;
  wallet: Wallet;
  onBack: () => void;
};

export function ProfileScreen({ user, wallet, onBack }: ProfileScreenProps) {
  const copyPublicKey = async () => {
    await ExpoClipboard.setStringAsync(user.publicKey);
    Alert.alert('Copied', 'Public key copied.');
  };

  return (
    <Screen>
      <Header title="Profile" subtitle="Local identity and public verification key." onBack={onBack} />
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <UserRound size={42} color={colors.dark} />
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      <View style={styles.metrics}>
        <Metric label="Wallet ID" value={compactId(user.id, 10, 8)} />
        <Metric label="Balance" value={formatCoins(wallet.balance)} />
        <Metric label="Key" value={compactId(user.publicKey, 12, 10)} />
      </View>

      <View style={styles.keyCard}>
        <KeyRound size={22} color={colors.dark} />
        <View style={styles.keyCopy}>
          <Text style={styles.keyLabel}>Public key</Text>
          <Text selectable style={styles.keyValue}>
            {user.publicKey}
          </Text>
        </View>
      </View>

      <Button
        label="Copy public key"
        variant="secondary"
        icon={<Copy size={18} color={colors.ink} />}
        onPress={copyPublicKey}
      />
      <Notice />
    </Screen>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 22,
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  name: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  username: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 8,
    padding: 12,
    minHeight: 84,
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#D0D5DD',
    fontSize: 11,
    fontWeight: '800',
  },
  metricValue: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 15,
  },
  keyCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.mint,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  keyCopy: {
    flex: 1,
  },
  keyLabel: {
    color: colors.dark,
    fontWeight: '900',
    marginBottom: 4,
  },
  keyValue: {
    color: colors.dark,
    lineHeight: 18,
    fontSize: 12,
    fontWeight: '600',
  },
});
