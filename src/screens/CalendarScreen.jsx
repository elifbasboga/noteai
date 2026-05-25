import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddExamModal from '../components/AddExamModal';
import { NotificationService } from '../services/notificationService';
import { useNotesStore } from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

function getMonthKey(dateValue) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function formatMonthTitle(dateValue) {
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateValue));
}

function formatDay(dateValue) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
  }).format(new Date(dateValue));
}

function formatShortMonth(dateValue) {
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'short',
  }).format(new Date(dateValue));
}

export default function CalendarScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const exams = useNotesStore((state) => state.exams);
  const deleteExam = useNotesStore((state) => state.deleteExam);
  const [modalVisible, setModalVisible] = useState(false);

  const groupedExams = useMemo(() => {
    return exams.reduce((groups, exam) => {
      const key = getMonthKey(exam.date);
      const existing = groups.find((group) => group.key === key);

      if (existing) {
        existing.data.push(exam);
      } else {
        groups.push({
          key,
          title: formatMonthTitle(exam.date),
          data: [exam],
        });
      }

      return groups;
    }, []);
  }, [exams]);

  function confirmDelete(exam) {
    Alert.alert('Sınavı sil', `"${exam.title}" silinsin mi?`, [
      {
        text: 'Vazgeç',
        style: 'cancel',
      },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await NotificationService.cancelNotification(exam.notificationId);
          deleteExam(exam.id);
        },
      },
    ]);
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
          Sınav Takvimi
        </Text>
        <Pressable
          accessibilityLabel="Sınav ekle"
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {exams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
            Henüz sınav eklenmedi
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}
          >
            Sağ üstteki + ile ekle
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {groupedExams.map((group) => (
            <View key={group.key} style={styles.monthGroup}>
              <Text
                style={[styles.monthTitle, { color: themeColors.textSecondary }]}
              >
                {group.title}
              </Text>

              {group.data.map((exam) => (
                <Pressable
                  key={exam.id}
                  onLongPress={() => confirmDelete(exam)}
                  style={({ pressed }) => [
                    styles.examCard,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.dateBlock,
                      { backgroundColor: exam.color || colors.primary },
                    ]}
                  >
                    <Text style={styles.dateDay}>{formatDay(exam.date)}</Text>
                    <Text style={styles.dateMonth}>{formatShortMonth(exam.date)}</Text>
                  </View>

                  <View style={styles.examInfo}>
                    <Text
                      style={[styles.examTitle, { color: themeColors.textPrimary }]}
                      numberOfLines={2}
                    >
                      {exam.title}
                    </Text>
                    <View style={styles.examMetaRow}>
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
                          styles.reminderBadge,
                          { borderColor: themeColors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reminderText,
                            { color: themeColors.textSecondary },
                          ]}
                        >
                          {exam.reminderDays} gün önce hatırlatma
                        </Text>
                      </View>
                    </View>

                    {exam.location ? (
                      <View style={styles.locationRow}>
                        <Ionicons
                          name="location-outline"
                          size={15}
                          color={themeColors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.locationText,
                            { color: themeColors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {exam.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <AddExamModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  container: {
    flex: 1,
  },
  dateBlock: {
    alignItems: 'center',
    borderRadius: 12,
    height: 72,
    justifyContent: 'center',
    width: 64,
  },
  dateDay: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: typography.weights.bold,
  },
  dateMonth: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.bold,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 14,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  examCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    flexDirection: 'row',
    marginTop: 10,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  examInfo: {
    flex: 1,
    marginLeft: 12,
  },
  examMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  examTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 22,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  locationText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    marginLeft: 4,
  },
  monthGroup: {
    marginBottom: 18,
  },
  monthTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  pressed: {
    opacity: 0.8,
  },
  reminderBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reminderText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  subjectPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
