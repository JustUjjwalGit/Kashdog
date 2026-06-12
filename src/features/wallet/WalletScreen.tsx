import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, History, QrCode, RefreshCw, Send, Settings, UserRound } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, shadows } from '../../core/theme/colors';
import { compactId, formatCoins } from '../../core/utils/format';
import type { AppRoute, Transaction, User, Wallet } from '../../shared/models/types';
import { Header } from '../../shared/widgets/Header';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';
import { TransactionRow } from '../../shared/widgets/TransactionRow';

type WalletScreenProps = {
  user: User;
  wallet: Wallet;
  recentTransactions: Transaction[];
  onNavigate: (route: AppRoute) => void;
};

export function WalletScreen({ user, wallet, recentTransactions, onNavigate }: WalletScreenProps) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <Screen>
      <Header
        title="KashDog"
        subtitle={`@${user.username} · ${compactId(user.id)}`}
        right={
          <Pressable accessibilityRole="button" onPress={() => onNavigate('settings')} style={styles.iconButton}>
            <Settings size={20} color={colors.ink} />
          </Pressable>
        }
      />
      <Animated.View style={[styles.cardWrap, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={[colors.dark, '#243B55', colors.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>Current balance</Text>
            <View style={styles.livePill}>
              <Clock size={12} color={colors.dark} />
              <Text style={styles.liveText}>Offline ready</Text>
            </View>
          </View>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.balance}>
            {formatCoins(wallet.balance)}
          </Text>
          <Text style={styles.cardFooter}>Virtual demo wallet · Not real money</Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.actions}>
        <Action label="Send" Icon={Send} onPress={() => onNavigate('send')} tone={colors.lime} />
        <Action label="Receive" Icon={QrCode} onPress={() => onNavigate('receive')} tone={colors.mint} />
        <Action label="Sync" Icon={RefreshCw} onPress={() => onNavigate('sync')} tone={colors.cyan} />
        <Action label="History" Icon={History} onPress={() => onNavigate('history')} tone={colors.amber} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        <Pressable onPress={() => onNavigate('profile')} style={styles.profileLink}>
          <UserRound size={16} color={colors.ink} />
          <Text style={styles.profileText}>Profile</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {recentTransactions.length === 0 ? (
          <Text style={styles.empty}>No demo transfers yet.</Text>
        ) : (
          recentTransactions.map((transaction) => (
            <TransactionRow key={transaction.transactionId} transaction={transaction} />
          ))
        )}
      </View>
      <Notice />
    </Screen>
  );
}

type ActionProps = {
  label: string;
  Icon: typeof Send;
  onPress: () => void;
  tone: string;
};

function Action({ label, Icon, onPress, tone }: ActionProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      <View style={[styles.actionIcon, { backgroundColor: tone }]}>
        <Icon size={21} color={colors.dark} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
  },
  cardWrap: {
    marginBottom: 20,
    ...shadows.card,
  },
  walletCard: {
    minHeight: 214,
    borderRadius: 8,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLabel: {
    color: '#D0D5DD',
    fontSize: 13,
    fontWeight: '700',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  liveText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: '900',
  },
  balance: {
    color: colors.surface,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: 0,
  },
  cardFooter: {
    color: '#EAECF0',
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  action: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileText: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 12,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  empty: {
    color: colors.muted,
    paddingVertical: 18,
    textAlign: 'center',
  },
});
