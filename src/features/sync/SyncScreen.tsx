import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { DatabaseZap, RefreshCw, ServerCog, Wifi } from 'lucide-react-native';

import { syncService } from '../../core/network/syncService';
import { colors } from '../../core/theme/colors';
import type { SyncResult, User } from '../../shared/models/types';
import { Button } from '../../shared/widgets/Button';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';
import { TextField } from '../../shared/widgets/TextField';

type SyncScreenProps = {
  user: User;
  onBack: () => void;
  onSynced: () => void;
};

export function SyncScreen({ user, onBack, onSynced }: SyncScreenProps) {
  const [endpoint, setEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    syncService.getEndpoint().then(setEndpoint);
  }, []);

  const saveEndpoint = async () => {
    await syncService.setEndpoint(endpoint);
    Alert.alert('Endpoint saved', 'Sync will use this backend URL.');
  };

  const runSync = async () => {
    setLoading(true);
    try {
      await syncService.setEndpoint(endpoint);
      const syncResult = await syncService.sync(user);
      setResult(syncResult);
      Alert.alert('Sync complete', `${syncResult.pushed} pushed, ${syncResult.verified} verified.`);
      onSynced();
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Sync" subtitle="Reconcile signed local transactions when internet returns." onBack={onBack} />
      <View style={styles.statusCard}>
        <Wifi size={34} color={colors.dark} />
        <Text style={styles.statusTitle}>Backend reconciliation</Text>
        <Text style={styles.statusText}>
          Pending transactions are pushed first, then KashDog pulls any transactions for this user and verifies signatures.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Backend URL"
          value={endpoint}
          onChangeText={setEndpoint}
          placeholder="http://localhost:4100"
          autoCapitalize="none"
        />
        <Button
          label="Save URL"
          variant="secondary"
          icon={<ServerCog size={18} color={colors.ink} />}
          onPress={saveEndpoint}
        />
        <Button
          label="Sync now"
          icon={<RefreshCw size={18} color={colors.dark} />}
          onPress={runSync}
          loading={loading}
        />
      </View>

      <View style={styles.result}>
        <DatabaseZap size={22} color={colors.dark} />
        <Text style={styles.resultText}>
          {result
            ? `${result.pushed} pushed · ${result.pulled} pulled · ${result.verified} verified`
            : 'No sync run in this session.'}
        </Text>
      </View>
      <Notice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: colors.cyan,
    borderRadius: 8,
    padding: 18,
    marginBottom: 16,
    gap: 10,
  },
  statusTitle: {
    color: colors.dark,
    fontWeight: '900',
    fontSize: 20,
  },
  statusText: {
    color: colors.dark,
    lineHeight: 20,
    fontWeight: '600',
  },
  form: {
    gap: 10,
    marginBottom: 16,
  },
  result: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 16,
  },
  resultText: {
    flex: 1,
    color: colors.ink,
    fontWeight: '800',
  },
});
