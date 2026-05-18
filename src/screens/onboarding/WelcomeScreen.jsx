import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: 'upload',
    icon: 'cloud-upload-outline',
    title: 'Notlarını yükle',
    description: 'PDF, fotoğraf veya el yazısı — hepsi olur',
  },
  {
    id: 'summarize',
    icon: 'sparkles-outline',
    title: 'AI özetlesin',
    description: 'Saniyeler içinde özet, anahtar kavramlar ve sorular',
  },
  {
    id: 'study',
    icon: 'school-outline',
    title: 'Sınavına hazırlan',
    description: 'Flashcard ve quiz ile akıllı tekrar',
  },
];

export default function WelcomeScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const [activeIndex, setActiveIndex] = useState(0);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  function goToProfileSetup() {
    navigation.navigate('ProfileSetup');
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {activeIndex < slides.length - 1 && (
        <Pressable style={styles.skipButton} onPress={goToProfileSetup}>
          <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
            Geç
          </Text>
        </Pressable>
      )}

      <FlatList
        data={slides}
        horizontal
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        pagingEnabled
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: themeColors.surface },
              ]}
            >
              <Ionicons name={item.icon} size={52} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>
              {item.title}
            </Text>
            <Text
              style={[
                styles.description,
                { color: themeColors.textSecondary },
              ]}
            >
              {item.description}
            </Text>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? colors.primary : themeColors.border,
                  width: index === activeIndex ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>

        {activeIndex === slides.length - 1 && (
          <Pressable style={styles.primaryButton} onPress={goToProfileSetup}>
            <Text style={styles.primaryButtonText}>Devam</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular,
    lineHeight: 25,
    marginTop: 12,
    maxWidth: 320,
    textAlign: 'center',
  },
  dot: {
    borderRadius: 999,
    height: 8,
    marginHorizontal: 4,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
  },
  footer: {
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 32,
    height: 128,
    justifyContent: 'center',
    marginBottom: 36,
    width: 128,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 54,
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  skipButton: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'absolute',
    right: 12,
    top: 54,
    zIndex: 1,
  },
  skipText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  slide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
});
