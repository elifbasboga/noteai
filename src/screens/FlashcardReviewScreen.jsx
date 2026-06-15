import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../hooks/useAppTheme';
import useNotesStore from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const ALL_SUBJECTS = 'Tümü';
const { width } = Dimensions.get('window');

function getCardId(noteId, index) {
  return `${noteId}_${index}`;
}

function isCardDue(progress) {
  if (!progress?.nextReview) {
    return true;
  }

  return new Date(progress.nextReview).getTime() <= Date.now();
}

function buildDueCards(notes, cardProgress, subject) {
  return notes.flatMap((note) => {
    const noteSubject = note.subject || 'Genel';

    if (subject !== ALL_SUBJECTS && noteSubject !== subject) {
      return [];
    }

    return (note.flashcards || [])
      .map((card, index) => ({
        ...card,
        id: getCardId(note.id, index),
        subject: noteSubject,
      }))
      .filter((card) => isCardDue(cardProgress[card.id]));
  });
}

export default function FlashcardReviewScreen({ navigation, route }) {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const subject = route.params?.subject || ALL_SUBJECTS;
  const notes = useNotesStore((state) => state.notes);
  const cardProgress = useNotesStore((state) => state.cardProgress);
  const updateCardProgress = useNotesStore((state) => state.updateCardProgress);
  const [cards, setCards] = useState(() =>
    buildDueCards(notes, cardProgress, subject)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState({
    easy: 0,
    good: 0,
    hard: 0,
    again: 0,
  });
  const flipValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCards(buildDueCards(notes, cardProgress, subject));
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setStats({ easy: 0, good: 0, hard: 0, again: 0 });
    flipValue.setValue(0);
    slideValue.setValue(0);
  }, [subject]);

  const currentCard = cards[currentIndex];
  const frontRotate = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  function flipCard() {
    Animated.timing(flipValue, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsFlipped((value) => !value);
  }

  function restart() {
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsFlipped(false);
    setStats({ easy: 0, good: 0, hard: 0, again: 0 });
    flipValue.setValue(0);
    slideValue.setValue(0);
  }

  function updateStats(grade) {
    setStats((current) => {
      if (grade === 5) return { ...current, easy: current.easy + 1 };
      if (grade === 4) return { ...current, good: current.good + 1 };
      if (grade === 2) return { ...current, hard: current.hard + 1 };
      return { ...current, again: current.again + 1 };
    });
  }

  function rateCard(grade) {
    if (!currentCard) {
      return;
    }

    updateCardProgress(currentCard.id, grade);
    updateStats(grade);

    if (currentIndex === cards.length - 1) {
      setIsCompleted(true);
      return;
    }

    Animated.timing(slideValue, {
      toValue: -width,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((index) => index + 1);
      setIsFlipped(false);
      flipValue.setValue(0);
      slideValue.setValue(width);
      Animated.timing(slideValue, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.centerState}>
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
            Bugün tekrar edilecek kart yok 🎉
          </Text>
          <Pressable style={styles.primaryButton} onPress={navigation.goBack}>
            <Text style={styles.primaryButtonText}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.centerState}>
          <Ionicons name="checkmark-circle" size={82} color={colors.success} />
          <Text style={[styles.completeTitle, { color: themeColors.textPrimary }]}>
            Tebrikler! 🎉
          </Text>
          <Text
            style={[styles.completeSubtitle, { color: themeColors.textSecondary }]}
          >
            {cards.length} kartı tamamladın
          </Text>

          <View
            style={[
              styles.statsBox,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Text style={[styles.statText, { color: colors.success }]}>
              Kolay: {stats.easy}
            </Text>
            <Text style={[styles.statText, { color: '#185FA5' }]}>
              İyi: {stats.good}
            </Text>
            <Text style={[styles.statText, { color: colors.warning }]}>
              Zor: {stats.hard}
            </Text>
            <Text style={[styles.statText, { color: colors.error }]}>
              Hiç Bilmedim: {stats.again}
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={restart}>
            <Text style={styles.primaryButtonText}>Tekrar Başla</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { borderColor: themeColors.border }]}
            onPress={navigation.goBack}
          >
            <Text style={[styles.secondaryButtonText, { color: themeColors.textPrimary }]}>
              Ana Sayfaya Dön
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={themeColors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
          Flashcard Tekrarı
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: themeColors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / cards.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.counter, { color: themeColors.textSecondary }]}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      <View style={styles.reviewBody}>
        <Animated.View
          style={[styles.cardStage, { transform: [{ translateX: slideValue }] }]}
        >
          <Pressable onPress={flipCard} style={styles.cardPressable}>
            <Animated.View
              style={[
                styles.flashcard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  transform: [{ rotateY: frontRotate }],
                },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.primary }]}>SORU</Text>
              <Text style={[styles.cardText, { color: themeColors.textPrimary }]}>
                {currentCard.front}
              </Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.flashcard,
                styles.cardBack,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  transform: [{ rotateY: backRotate }],
                },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.primary }]}>CEVAP</Text>
              <Text style={[styles.cardText, { color: themeColors.textPrimary }]}>
                {currentCard.back}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {!isFlipped ? (
          <Pressable style={styles.primaryButton} onPress={flipCard}>
            <Text style={styles.primaryButtonText}>Çevir</Text>
          </Pressable>
        ) : (
          <View style={styles.ratingRow}>
            <Pressable
              style={[styles.ratingButton, { backgroundColor: colors.error }]}
              onPress={() => rateCard(0)}
            >
              <Text style={styles.ratingText}>Hiç Bilmedim</Text>
            </Pressable>
            <Pressable
              style={[styles.ratingButton, { backgroundColor: colors.warning }]}
              onPress={() => rateCard(2)}
            >
              <Text style={styles.ratingText}>Zor</Text>
            </Pressable>
            <Pressable
              style={[styles.ratingButton, { backgroundColor: '#185FA5' }]}
              onPress={() => rateCard(4)}
            >
              <Text style={styles.ratingText}>İyi</Text>
            </Pressable>
            <Pressable
              style={[styles.ratingButton, { backgroundColor: colors.success }]}
              onPress={() => rateCard(5)}
            >
              <Text style={styles.ratingText}>Kolay</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cardBack: {
    position: 'absolute',
  },
  cardLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0,
    marginBottom: 18,
  },
  cardPressable: {
    height: 330,
    width: width * 0.8,
  },
  cardStage: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cardText: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    lineHeight: 27,
    textAlign: 'center',
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  completeSubtitle: {
    fontSize: typography.sizes.md,
    marginTop: 6,
  },
  completeTitle: {
    fontSize: 30,
    fontWeight: typography.weights.bold,
    marginTop: 18,
  },
  container: {
    flex: 1,
  },
  counter: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 20,
    textAlign: 'center',
  },
  flashcard: {
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 5,
    height: 330,
    justifyContent: 'center',
    padding: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    width: width * 0.8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 22,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  progressTrack: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progressWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  ratingButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  reviewBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52,
    paddingHorizontal: 22,
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  statText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginVertical: 4,
  },
  statsBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 24,
    padding: 18,
    width: '100%',
  },
});
