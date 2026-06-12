import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Fingerprint, LockKeyhole } from 'lucide-react-native';

import { authService } from './authService';
import { colors } from '../../core/theme/colors';
import { Button } from '../../shared/widgets/Button';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';
import { TextField } from '../../shared/widgets/TextField';

type LoginScreenProps = {
  onUnlocked: () => void;
  userName?: string;
};

export function LoginScreen({ onUnlocked, userName }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyPin = async () => {
    setLoading(true);
    try {
      if (await authService.verifyPin(pin)) {
        onUnlocked();
      } else {
        Alert.alert('Wrong PIN', 'That PIN did not unlock this demo wallet.');
      }
    } finally {
      setLoading(false);
    }
  };

  const biometric = async () => {
    setLoading(true);
    try {
      const ok = await authService.authenticateWithBiometric();
      if (ok) {
        onUnlocked();
      }
    } catch (error) {
      Alert.alert('Biometric unavailable', error instanceof Error ? error.message : 'Use your PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Unlock KashDog" subtitle={userName ? `Welcome back, ${userName}.` : 'Enter your PIN.'} />
      <View style={styles.lock}>
        <LockKeyhole size={46} color={colors.dark} />
        <Text style={styles.lockText}>Session auto-locks after inactivity.</Text>
      </View>
      <View style={styles.form}>
        <TextField
          label="PIN"
          value={pin}
          onChangeText={setPin}
          placeholder="Your wallet PIN"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
        />
        <Button label="Unlock" onPress={verifyPin} loading={loading} />
        <Button
          label="Use biometric"
          variant="secondary"
          icon={<Fingerprint size={18} color={colors.ink} />}
          onPress={biometric}
          disabled={loading}
        />
      </View>
      <Notice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lock: {
    minHeight: 180,
    borderRadius: 8,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 18,
    gap: 12,
  },
  lockText: {
    color: colors.dark,
    fontWeight: '800',
    fontSize: 17,
  },
  form: {
    gap: 12,
    marginBottom: 18,
  },
});
