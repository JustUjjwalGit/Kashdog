import { useRef, useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View } from 'react-native';
import { Bluetooth, ShieldCheck, WalletCards } from 'lucide-react-native';

import { colors } from '../../core/theme/colors';
import { Button } from '../../shared/widgets/Button';
import { Notice } from '../../shared/widgets/Notice';
import { Screen } from '../../shared/widgets/Screen';

const pages = [
  {
    title: 'Offline payments anywhere.',
    body: 'Move virtual value around campuses, events, and local communities when internet is unreliable.',
    Icon: WalletCards,
    accent: colors.lime,
  },
  {
    title: 'Secure wallet system.',
    body: 'Every wallet gets a local key pair and every transaction is signed before it leaves the device.',
    Icon: ShieldCheck,
    accent: colors.mint,
  },
  {
    title: 'Bluetooth powered transfers.',
    body: 'QR discovers the receiver, then the transaction packet can move over a nearby offline transport.',
    Icon: Bluetooth,
    accent: colors.cyan,
  },
];

type OnboardingScreenProps = {
  onDone: () => void;
};

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const listRef = useRef<FlatList<(typeof pages)[number]>>(null);
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width - 40;

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <Screen scroll={false}>
      <View style={styles.brandRow}>
        <View style={styles.mark}>
          <Text style={styles.markText}>K</Text>
        </View>
        <Text style={styles.brand}>KashDog</Text>
      </View>

      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={pages}
        keyExtractor={(item) => item.title}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => {
          const Icon = item.Icon;
          return (
            <View style={[styles.page, { width }]}>
              <View style={[styles.visual, { backgroundColor: item.accent }]}>
                <Icon size={76} color={colors.dark} strokeWidth={1.8} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          );
        }}
      />

      <View style={styles.dots}>
        {pages.map((page, pageIndex) => (
          <View
            key={page.title}
            style={[styles.dot, pageIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      <Notice />

      <Button
        label={index === pages.length - 1 ? 'Create demo wallet' : 'Next'}
        onPress={() => {
          if (index === pages.length - 1) {
            onDone();
            return;
          }
          listRef.current?.scrollToIndex({ index: index + 1, animated: true });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    color: colors.lime,
    fontWeight: '900',
    fontSize: 20,
  },
  brand: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 22,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
  },
  visual: {
    width: 180,
    height: 180,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
    transform: [{ rotate: '-3deg' }],
  },
  title: {
    color: colors.ink,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: 0,
    maxWidth: 310,
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 14,
    maxWidth: 330,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  activeDot: {
    width: 28,
    backgroundColor: colors.dark,
  },
});
