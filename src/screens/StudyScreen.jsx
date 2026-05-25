import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotesStore } from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const ALL_SUBJECTS = 'Tümü';

function getCardId(noteId, index) {
  return `${noteId}_${index}`;
}

function isCardDue(progress) {
  if (!progress?.nextReview) {
    return true;
  }

  return new Date(progress.nextReview).getTime() <= Date.now();
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export default function StudyScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const notes = useNotesStore((state) => state.notes);
  const cardProgress = useNotesStore((state) => state.cardProgress);
  const quizResults = useNotesStore((state) => state.quizResults);
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS);

  const subjects = useMemo(() => {
    const uniqueSubjects = notes
      .filter((note) => note.flashcards?.length > 0)
      .map((note) => note.subject || 'Genel')
      .filter((subject, index, list) => list.indexOf(subject) === index);

    return [ALL_SUBJECTS, ...uniqueSubjects];
  }, [notes]);

  const dueCards = useMemo(() => {
    return notes.flatMap((note) => {
      if (selectedSubject !== ALL_SUBJECTS && (note.subject || 'Genel') !== selectedSubject) {
        return [];
      }

      return (note.flashcards || [])
        .map((card, index) => ({
          ...card,
          id: getCardId(note.id, index),
          subject: note.subject || 'Genel',
        }))
        .filter((card) => isCardDue(cardProgress[card.id]));
    });
  }, [cardProgress, notes, selectedSubject]);

  const totalDueCards = useMemo(() => {
    return notes.reduce((total, note) => {
      return (
        total +
        (note.flashcards || []).filter((card, index) =>
          isCardDue(cardProgress[getCardId(note.id, index)])
        ).length
      );
    }, 0);
  }, [cardProgress, notes]);

  const recentResults = quizResults.slice(0, 5);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            Çalış
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {totalDueCards} kart seni bekliyor
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectScroll}
        >
          {subjects.map((subject) => {
            const isSelected = subject === selectedSubject;

            return (
              <Pressable
                key={subject}
                onPress={() => setSelectedSubject(subject)}
                style={({ pressed }) => [
                  styles.subjectPill,
                  {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                    borderColor: isSelected ? colors.primary : themeColors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.subjectText,
                    {
                      color: isSelected ? '#FFFFFF' : themeColors.textSecondary,
                    },
                  ]}
                >
                  {subject}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.modeGrid}>
          <Pressable
            onPress={() =>
              navigation.navigate('FlashcardReview', { subject: selectedSubject })
            }
            style={({ pressed }) => [
              styles.modeCard,
              styles.flashcardMode,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.modeOverlay} />
            <Ionicons name="albums-outline" size={34} color="#FFFFFF" />
            <Text style={styles.modeTitle}>Flashcard Tekrarı</Text>
            <Text style={styles.modeSubtitle}>
              {dueCards.length} kart tekrar için hazır
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Quiz', { subject: selectedSubject })}
            style={({ pressed }) => [
              styles.modeCard,
              styles.quizMode,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="help-circle-outline" size={34} color="#FFFFFF" />
            <Text style={styles.modeTitle}>Quiz Modu</Text>
            <Text style={styles.modeSubtitle}>Bilgini test et</Text>
          </Pressable>
        </View>

        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Son Aktivite
          </Text>

          {recentResults.length === 0 ? (
            <View
              style={[
                styles.emptyActivity,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyActivityText,
                  { color: themeColors.textSecondary },
                ]}
              >
                Henüz quiz çözmedin
              </Text>
            </View>
          ) : (
            recentResults.map((result) => (
              <View
                key={`${result.date}-${result.subject}`}
                style={[
                  styles.activityRow,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.activitySubject,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {result.subject}
                  </Text>
                  <Text
                    style={[
                      styles.activityDate,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {formatDate(result.date)}
                  </Text>
                </View>
                <Text style={[styles.activityScore, { color: colors.primary }]}>
                  {result.score}/{result.total}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activityDate: {
    fontSize: typography.sizes.sm,
    marginTop: 3,
  },
  activityRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 14,
  },
  activityScore: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  activitySection: {
    marginTop: 26,
  },
  activitySubject: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 34,
  },
  emptyActivity: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    padding: 18,
  },
  emptyActivityText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  flashcardMode: {
    backgroundColor: colors.primary,
  },
  header: {
    marginBottom: 18,
  },
  modeCard: {
    borderRadius: 16,
    flex: 1,
    minHeight: 158,
    overflow: 'hidden',
    padding: 18,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modeOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    bottom: -28,
    height: 120,
    position: 'absolute',
    right: -28,
    transform: [{ rotate: '18deg' }],
    width: 120,
  },
  modeSubtitle: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    marginTop: 8,
  },
  modeTitle: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 22,
    marginTop: 16,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  quizMode: {
    backgroundColor: '#0F6E56',
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subjectPill: {
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  subjectScroll: {
    marginHorizontal: -20,
    paddingLeft: 20,
  },
  subjectText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
  },
});
