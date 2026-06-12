import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { EDUCATIONAL_NOTICE } from '../../core/constants/app';
import { colors } from '../../core/theme/colors';

export function Notice() {
  return (
    <View style={styles.notice}>
      <ShieldCheck size={18} color={colors.dark} />
      <Text style={styles.text}>{EDUCATIONAL_NOTICE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7D6',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  text: {
    flex: 1,
    color: colors.dark,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
});
