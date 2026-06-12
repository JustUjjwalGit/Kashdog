import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Lock, RotateCcw, ShieldAlert } from 'lucide-react-native';

import { authService } from '../auth/authService';
import { colors } from '../../core/theme/colors';
import { Button } from '../../shared/widgets/Button';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';

type SettingsScreenProps = {
  onBack: () => void;
  onLock: () => void;
  onReset: () => void;
};

export function SettingsScreen({ onBack, onLock, onReset }: SettingsScreenProps) {
  const reset = () => {
    Alert.alert(
      'Reset prototype?',
      'This deletes the local demo account, keys, wallet, and transaction history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await authService.resetPrototype();
            onReset();
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Header title="Settings" subtitle="Security and prototype controls." onBack={onBack} />
      <View style={styles.group}>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Auto-lock</Text>
            <Text style={styles.settingText}>Locks after inactivity using the local PIN session.</Text>
          </View>
          <Switch value disabled trackColor={{ true: colors.lime, false: colors.line }} />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Biometrics</Text>
            <Text style={styles.settingText}>Available when enrolled on device.</Text>
          </View>
          <Switch value disabled trackColor={{ true: colors.mint, false: colors.line }} />
        </View>
      </View>

      <View style={styles.warning}>
        <ShieldAlert size={22} color={colors.dark} />
        <Text style={styles.warningText}>
          Private keys stay in secure device storage. This prototype never connects to UPI, banks, or real money rails.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Lock now"
          variant="secondary"
          icon={<Lock size={18} color={colors.ink} />}
          onPress={onLock}
        />
        <Button
          label="Reset prototype"
          variant="danger"
          icon={<RotateCcw size={18} color={colors.danger} />}
          onPress={reset}
        />
      </View>
      <Notice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  settingRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 12,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 16,
  },
  settingText: {
    color: colors.muted,
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  warning: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF7D6',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    color: colors.dark,
    fontWeight: '700',
    lineHeight: 19,
    fontSize: 13,
  },
  actions: {
    gap: 10,
    marginBottom: 14,
  },
});
