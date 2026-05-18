import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>📚</Text>
      <Text style={styles.title}>NoteAI</Text>
      <Text style={styles.tagline}>Akıllı ders notu asistanın</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 72,
    marginBottom: 18,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: typography.weights.bold,
  },
});
