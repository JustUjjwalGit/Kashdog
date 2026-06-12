import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { KeyRound, UserPlus } from 'lucide-react-native';

import { authService } from './authService';
import { colors } from '../../core/theme/colors';
import type { User, Wallet } from '../../shared/models/types';
import { Button } from '../../shared/widgets/Button';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';
import { TextField } from '../../shared/widgets/TextField';

type RegisterScreenProps = {
  onRegistered: (user: User, wallet: Wallet) => void;
};

export function RegisterScreen({ onRegistered }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setLoading(true);
    try {
      const result = await authService.register({ name, username, pin });
      onRegistered(result.user, result.wallet);
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Create wallet" subtitle="Your demo balance and key pair are generated on this device." />
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <KeyRound size={34} color={colors.dark} />
        </View>
        <Text style={styles.heroText}>1000 demo coins are loaded after setup.</Text>
      </View>
      <View style={styles.form}>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="Aarav Sharma" />
        <TextField
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="aarav_12"
          autoCorrect={false}
        />
        <TextField
          label="PIN"
          value={pin}
          onChangeText={setPin}
          placeholder="4-8 digits"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
        />
      </View>
      <Notice />
      <Button
        label="Generate wallet"
        icon={<UserPlus size={18} color={colors.dark} />}
        onPress={register}
        loading={loading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.dark,
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    color: colors.surface,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  form: {
    gap: 14,
    marginBottom: 18,
  },
});
