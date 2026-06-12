import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ONBOARDING_STORAGE_KEY, SESSION_TIMEOUT_MS } from './src/core/constants/app';
import { kashdogRepository } from './src/core/database/kashdogRepository';
import { colors } from './src/core/theme/colors';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { RegisterScreen } from './src/features/auth/RegisterScreen';
import { HistoryScreen } from './src/features/history/HistoryScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { SendScreen } from './src/features/payments/SendScreen';
import { ProfileScreen } from './src/features/profile/ProfileScreen';
import { ReceiveScreen } from './src/features/receive/ReceiveScreen';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { SyncScreen } from './src/features/sync/SyncScreen';
import { WalletScreen } from './src/features/wallet/WalletScreen';
import type { AppRoute, Transaction, User, Wallet } from './src/shared/models/types';

export default function App() {
  return (
    <SafeAreaProvider>
      <KashDogApp />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

function KashDogApp() {
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState<AppRoute>('onboarding');
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const lastActiveAt = useRef(Date.now());

  const refresh = useCallback(async () => {
    const currentUser = await kashdogRepository.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const [currentWallet, localTransactions] = await Promise.all([
        kashdogRepository.getWallet(currentUser.id),
        kashdogRepository.getTransactions(100),
      ]);
      setWallet(currentWallet);
      setTransactions(localTransactions);
    } else {
      setWallet(null);
      setTransactions([]);
    }
  }, []);

  const boot = useCallback(async () => {
    setBooting(true);
    try {
      await refresh();
      const [currentUser, onboarded] = await Promise.all([
        kashdogRepository.getCurrentUser(),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
      ]);

      if (!onboarded) {
        setRoute('onboarding');
      } else if (!currentUser) {
        setRoute('register');
      } else {
        setRoute('login');
      }
    } finally {
      setBooting(false);
    }
  }, [refresh]);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const expired = Date.now() - lastActiveAt.current > SESSION_TIMEOUT_MS;
        if (expired && user) {
          setUnlocked(false);
          setRoute('login');
        }
      } else {
        lastActiveAt.current = Date.now();
      }
    });

    return () => subscription.remove();
  }, [user]);

  const navigate = async (nextRoute: AppRoute) => {
    lastActiveAt.current = Date.now();
    if (nextRoute !== 'onboarding' && nextRoute !== 'register' && nextRoute !== 'login') {
      await refresh();
    }
    setRoute(nextRoute);
  };

  const onOnboardingDone = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setRoute('register');
  };

  const lock = () => {
    setUnlocked(false);
    setRoute('login');
  };

  const afterMutation = async (nextRoute: AppRoute = 'home') => {
    await refresh();
    setRoute(nextRoute);
  };

  const reset = async () => {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setUnlocked(false);
    setUser(null);
    setWallet(null);
    setTransactions([]);
    setRoute('onboarding');
  };

  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (booting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dark} />
        <Text style={styles.loadingText}>Preparing KashDog</Text>
      </View>
    );
  }

  if (route === 'onboarding') {
    return <OnboardingScreen onDone={onOnboardingDone} />;
  }

  if (route === 'register') {
    return (
      <RegisterScreen
        onRegistered={(nextUser, nextWallet) => {
          setUser(nextUser);
          setWallet(nextWallet);
          setUnlocked(true);
          setRoute('home');
        }}
      />
    );
  }

  if (!user || !wallet) {
    return <RegisterScreen onRegistered={() => afterMutation('home')} />;
  }

  if (!unlocked || route === 'login') {
    return (
      <LoginScreen
        userName={user.name}
        onUnlocked={() => {
          setUnlocked(true);
          afterMutation('home');
        }}
      />
    );
  }

  switch (route) {
    case 'send':
      return <SendScreen user={user} wallet={wallet} onBack={() => navigate('home')} onSent={() => afterMutation('home')} />;
    case 'receive':
      return <ReceiveScreen user={user} onBack={() => navigate('home')} onAccepted={() => afterMutation('home')} />;
    case 'history':
      return <HistoryScreen transactions={transactions} onBack={() => navigate('home')} />;
    case 'sync':
      return <SyncScreen user={user} onBack={() => navigate('home')} onSynced={() => afterMutation('home')} />;
    case 'profile':
      return <ProfileScreen user={user} wallet={wallet} onBack={() => navigate('home')} />;
    case 'settings':
      return <SettingsScreen onBack={() => navigate('home')} onLock={lock} onReset={reset} />;
    case 'home':
    default:
      return (
        <WalletScreen
          user={user}
          wallet={wallet}
          recentTransactions={recent}
          onNavigate={navigate}
        />
      );
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    gap: 12,
  },
  loadingText: {
    color: colors.ink,
    fontWeight: '900',
  },
});
