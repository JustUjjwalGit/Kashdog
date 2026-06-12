import { StyleSheet, Text, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock3 } from 'lucide-react-native';

import { formatCoins, formatDateTime } from '../../core/utils/format';
import { colors } from '../../core/theme/colors';
import type { Transaction } from '../models/types';

type TransactionRowProps = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isSent = transaction.direction === 'sent';
  const Icon = isSent ? ArrowUpRight : ArrowDownLeft;
  const StatusIcon = transaction.syncedAt ? CheckCircle2 : Clock3;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, isSent ? styles.sent : styles.received]}>
        <Icon size={18} color={colors.dark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{isSent ? 'Sent demo coins' : 'Received demo coins'}</Text>
        <Text style={styles.meta}>{formatDateTime(transaction.timestamp)}</Text>
      </View>
      <View style={styles.amountBlock}>
        <Text style={[styles.amount, isSent ? styles.negative : styles.positive]}>
          {isSent ? '-' : '+'}
          {formatCoins(transaction.amount)}
        </Text>
        <View style={styles.status}>
          <StatusIcon size={12} color={colors.muted} />
          <Text style={styles.statusText}>{transaction.syncedAt ? 'Synced' : transaction.status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sent: {
    backgroundColor: '#FFE4E8',
  },
  received: {
    backgroundColor: '#D9FBEA',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 14,
  },
  meta: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 12,
  },
  amountBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '900',
  },
  negative: {
    color: colors.danger,
  },
  positive: {
    color: colors.success,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    color: colors.muted,
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
