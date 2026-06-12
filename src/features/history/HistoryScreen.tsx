import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../core/theme/colors';
import type { Transaction } from '../../shared/models/types';
import { Header } from '../../shared/widgets/Header';
import { Screen } from '../../shared/widgets/Screen';
import { TransactionRow } from '../../shared/widgets/TransactionRow';

type HistoryScreenProps = {
  transactions: Transaction[];
  onBack: () => void;
};

export function HistoryScreen({ transactions, onBack }: HistoryScreenProps) {
  return (
    <Screen>
      <Header title="History" subtitle="Local-first transaction ledger." onBack={onBack} />
      <View style={styles.list}>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No local transactions yet.</Text>
        ) : (
          transactions.map((transaction) => (
            <TransactionRow key={transaction.transactionId} transaction={transaction} />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
