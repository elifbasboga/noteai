import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../hooks/useAppTheme';
import useNotesStore from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

function formatToday() {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date());
}

function formatExamDate(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(value));
}

function formatNoteDate(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getDaysRemaining(dateValue) {
  const today = startOfDay(new Date());
  const examDate = startOfDay(new Date(dateValue));
  return Math.max(
    0,
    Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function getDaysBadgeColor(days) {
  if (days <= 3) {
    return colors.error;
  }

  if (days <= 7) {
    return colors.warning;
  }

  return colors.success;
}

function getCardId(noteId, index) {
  return `${noteId}_${index}`;
}

function isDue(progress) {
  if (!progress?.nextReview) {
    return true;
  }

  return new Date(progress.nextReview).getTime() <= Date.now();
}

function isReviewedToday(progress) {
  if (!progress?.lastReviewed) {
    return false;
  }

  return (
    startOfDay(new Date(progress.lastReviewed)).getTime() ===
    startOfDay(new Date()).getTime()
  );
}

export default function HomeScreen({ navigation }) {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const notes = useNotesStore((state) => state.notes);
  const profile = useNotesStore((state) => state.profile);
  const exams = useNotesStore((state) => state.exams);
  const cardProgress = useNotesStore((state) => state.cardProgress);
  const today = startOfDay(new Date());
  const totalFlashcards = notes.reduce(
    (total, note) => total + (note.flashcards?.length || 0),
    0
  );
  const upcomingExams = exams
    .filter((exam) => startOfDay(new Date(exam.date)) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const allCards = notes.flatMap((note) =>
    (note.flashcards || []).map((card, index) => ({
      ...card,
      id: getCardId(note.id, index),
    }))
  );
  const dueCards = allCards.filter((card) => isDue(cardProgress[card.id]));
  const reviewedToday = allCards.filter((card) =>
    isReviewedToday(cardProgress[card.id])
  ).length;
  const totalTodayCards = dueCards.length + reviewedToday;
  const progress =
    totalTodayCards > 0 ? Math.min(100, (reviewedToday / totalTodayCards) * 100) : 100;
  const recentNotes = notes.slice(0, 3);
  const displayName = profile.name || 'öğrenci';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.greetingHeader}>
          <View style={styles.greetingTextWrap}>
            <Text style={[styles.greeting, { color: themeColors.textPrimary }]}>
              Merhaba, {displayName}! 👋
            </Text>
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {formatToday()}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Bugün ne öğreniyoruz?
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Calendar')}
            style={({ pressed }) => [styles.calendarShortcut, pressed && styles.pressed]}
          >
            <Ionicons name="calendar-outline" size={23} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Text style={styles.statNumber}>{notes.length}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Notlar
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Text style={styles.statNumber}>{totalFlashcards}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Kartlar
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Text style={styles.statNumber}>{upcomingExams.length}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Sınavlar
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Yaklaşan Sınavlar
          </Text>
          <Pressable onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.sectionLink}>Tümünü Gör</Text>
          </Pressable>
        </View>

        {upcomingExams.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Yaklaşan sınav yok 🎉
            </Text>
          </View>
        ) : (
          upcomingExams.slice(0, 3).map((exam) => {
            const days = getDaysRemaining(exam.date);

            return (
              <View
                key={exam.id}
                style={[
                  styles.examCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View style={styles.examCardHeader}>
                  <View
                    style={[
                      styles.subjectPill,
                      { backgroundColor: exam.color || colors.primary },
                    ]}
                  >
                    <Text style={styles.subjectText}>{exam.subject}</Text>
                  </View>
                  <View
                    style={[
                      styles.daysBadge,
                      { backgroundColor: getDaysBadgeColor(days) },
                    ]}
                  >
                    <Text style={styles.daysBadgeText}>
                      {days === 0 ? 'Bugün' : `${days} gün kaldı`}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.examTitle, { color: themeColors.textPrimary }]}
                  numberOfLines={2}
                >
                  {exam.title}
                </Text>
                <Text
                  style={[styles.examDate, { color: themeColors.textSecondary }]}
                >
                  {formatExamDate(exam.date)}
                </Text>
              </View>
            );
          })
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Bugün Tekrar Edilecek
          </Text>
          <Pressable onPress={() => navigation.navigate('Study')}>
            <Text style={styles.sectionLink}>Çalış</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.reviewCard,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          ]}
        >
          {totalTodayCards === 0 ? (
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Bugün tüm kartları tamamladın! 🌟
            </Text>
          ) : (
            <>
              <View style={styles.reviewTopRow}>
                <Text
                  style={[styles.reviewCount, { color: themeColors.textPrimary }]}
                >
                  {dueCards.length} kart kaldı
                </Text>
                <Text style={[styles.reviewMeta, { color: themeColors.textSecondary }]}>
                  {reviewedToday}/{totalTodayCards}
                </Text>
              </View>
              <View
                style={[styles.progressTrack, { backgroundColor: themeColors.border }]}
              >
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Son Notlar
          </Text>
        </View>

        {recentNotes.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Henüz not eklemedin
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.notesScroll}
          >
            {recentNotes.map((note) => (
              <Pressable
                key={note.id}
                onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}
                style={({ pressed }) => [
                  styles.noteCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.subjectPill, { backgroundColor: colors.primary }]}>
                  <Text style={styles.subjectText}>{note.subject || 'Genel'}</Text>
                </View>
                <Text
                  style={[styles.noteTitle, { color: themeColors.textPrimary }]}
                  numberOfLines={2}
                >
                  {note.title}
                </Text>
                <Text style={[styles.noteDate, { color: themeColors.textSecondary }]}>
                  {formatNoteDate(note.createdAt)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  calendarShortcut: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 34,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    marginTop: 5,
    textTransform: 'capitalize',
  },
  daysBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  daysBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  examCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  examCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  examDate: {
    fontSize: typography.sizes.sm,
    marginTop: 5,
    textTransform: 'capitalize',
  },
  examTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 23,
  },
  greeting: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    lineHeight: 34,
  },
  greetingHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greetingTextWrap: {
    flex: 1,
    paddingRight: 14,
  },
  noteCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 12,
    minHeight: 132,
    padding: 14,
    width: 190,
  },
  noteDate: {
    fontSize: typography.sizes.sm,
    marginTop: 'auto',
  },
  noteTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    lineHeight: 21,
    marginTop: 12,
  },
  notesScroll: {
    marginRight: -20,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  progressTrack: {
    borderRadius: 999,
    height: 9,
    overflow: 'hidden',
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  reviewCount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  reviewMeta: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  reviewTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 26,
  },
  sectionLink: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingVertical: 14,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: typography.weights.medium,
    marginTop: 4,
  },
  statNumber: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: typography.weights.bold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  subjectPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    marginTop: 10,
  },
});
