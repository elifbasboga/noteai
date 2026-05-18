import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.text, { color: themeColors.textPrimary }]}>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
});
