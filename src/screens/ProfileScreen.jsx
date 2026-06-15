import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../hooks/useAppTheme';
import EditProfileModal from '../components/EditProfileModal';
import { NotificationService } from '../services/notificationService';
import useNotesStore from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const chartWidth = Dimensions.get('window').width - 32;
const subjectColors = ['#7C3AED', '#0F6E56', '#854F0B', '#993556', '#185FA5'];
const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function getInitials(name) {
  if (!name?.trim()) {
    return 'NA';
  }

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function getSubjectColor(subject) {
  if (!subject) {
    return subjectColors[0];
  }

  const index = subject
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return subjectColors[index % subjectColors.length];
}

function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getPercentage(score, total) {
  if (!total) {
    return 0;
  }

  return Math.round((score / total) * 100);
}

function getBadgeColor(percentage) {
  if (percentage >= 80) {
    return colors.success;
  }

  if (percentage >= 60) {
    return colors.warning;
  }

  return colors.error;
}

export default function ProfileScreen() {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const notes = useNotesStore((state) => state.notes);
  const profile = useNotesStore((state) => state.profile);
  const quizResults = useNotesStore((state) => state.quizResults);
  const clearQuizResults = useNotesStore((state) => state.clearQuizResults);
  const resetStore = useNotesStore((state) => state.resetStore);
  const themeMode = useNotesStore((state) => state.themeMode);
  const setThemeMode = useNotesStore((state) => state.setThemeMode);
  const [editVisible, setEditVisible] = useState(false);
  const totalFlashcards = notes.reduce(
    (total, note) => total + (note.flashcards?.length || 0),
    0
  );
  const averageScore =
    quizResults.length > 0
      ? Math.round(
          quizResults.reduce(
            (total, result) => total + getPercentage(result.score, result.total),
            0
          ) / quizResults.length
        )
      : null;
  const weeklyActivity = useMemo(() => {
    const today = startOfDay(new Date());

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toDateString();
      const count = quizResults.filter(
        (result) => startOfDay(new Date(result.date)).toDateString() === key
      ).length;

      return {
        label: dayLabels[date.getDay()],
        count,
      };
    });
  }, [quizResults]);
  const subjectPerformance = useMemo(() => {
    const grouped = quizResults.reduce((acc, result) => {
      const subject = result.subject || 'Genel';
      const percentage = getPercentage(result.score, result.total);

      if (!acc[subject]) {
        acc[subject] = [];
      }

      acc[subject].push(percentage);
      return acc;
    }, {});

    return Object.entries(grouped).map(([subject, scores]) => ({
      subject,
      average: Math.round(
        scores.reduce((total, score) => total + score, 0) / scores.length
      ),
      color: getSubjectColor(subject),
    }));
  }, [quizResults]);

  function confirmClearQuizHistory() {
    Alert.alert('Quiz geçmişini temizle', 'Tüm quiz sonuçları silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: clearQuizResults,
      },
    ]);
  }

  function confirmResetStore() {
    Alert.alert('Tüm verileri sıfırla', 'Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Devam et',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Emin misin?',
            'Notlar, sınavlar, quiz geçmişi ve profil bilgileri silinecek.',
            [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sıfırla',
                style: 'destructive',
                onPress: async () => {
                  await NotificationService.cancelAll();
                  resetStore();
                },
              },
            ]
          );
        },
      },
    ]);
  }

  const chartConfig = {
    backgroundColor: themeColors.surface,
    backgroundGradientFrom: themeColors.surface,
    backgroundGradientTo: themeColors.surface,
    color: () => colors.primary,
    labelColor: () => themeColors.textSecondary,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      stroke: themeColors.border,
    },
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
          </View>
          <View style={styles.profileTextWrap}>
            <Text style={[styles.name, { color: themeColors.textPrimary }]}>
              {profile.name || 'NoteAI Kullanıcısı'}
            </Text>
            <Text
              style={[styles.schoolText, { color: themeColors.textSecondary }]}
              numberOfLines={2}
            >
              {[profile.university, profile.department].filter(Boolean).join(' • ') ||
                'Üniversite ve bölüm ekle'}
            </Text>
          </View>
          <Pressable
            onPress={() => setEditVisible(true)}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <Text style={styles.editButtonText}>Düzenle</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="document-text-outline"
            label="Toplam Not"
            value={notes.length}
            themeColors={themeColors}
          />
          <StatCard
            icon="albums-outline"
            label="Flashcard"
            value={totalFlashcards}
            themeColors={themeColors}
          />
          <StatCard
            icon="help-circle-outline"
            label="Quiz Çözüldü"
            value={quizResults.length}
            themeColors={themeColors}
          />
          <StatCard
            icon="stats-chart-outline"
            label="Ortalama Skor"
            value={averageScore === null ? '--' : `${averageScore}%`}
            themeColors={themeColors}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Haftalık Aktivite
          </Text>
        </View>
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <BarChart
            chartConfig={chartConfig}
            data={{
              labels: weeklyActivity.map((day) => day.label),
              datasets: [{ data: weeklyActivity.map((day) => day.count) }],
            }}
            fromZero
            height={180}
            showValuesOnTopOfBars
            style={styles.chart}
            width={chartWidth}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Derse Göre Performans
          </Text>
        </View>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {subjectPerformance.length === 0 ? (
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Henüz quiz çözmedin
            </Text>
          ) : (
            subjectPerformance.map((item) => (
              <View key={item.subject} style={styles.performanceRow}>
                <View style={styles.performanceTop}>
                  <Text
                    style={[
                      styles.performanceSubject,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {item.subject}
                  </Text>
                  <Text style={[styles.performanceScore, { color: item.color }]}>
                    {item.average}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: themeColors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: item.color, width: `${item.average}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Quiz Geçmişi
          </Text>
        </View>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {quizResults.length === 0 ? (
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Henüz quiz çözmedin
            </Text>
          ) : (
            quizResults.slice(0, 10).map((result) => {
              const percentage = getPercentage(result.score, result.total);

              return (
                <View key={`${result.date}-${result.subject}`} style={styles.historyRow}>
                  <View
                    style={[
                      styles.subjectPill,
                      { backgroundColor: getSubjectColor(result.subject) },
                    ]}
                  >
                    <Text style={styles.subjectPillText}>{result.subject}</Text>
                  </View>
                  <View style={styles.historyScoreWrap}>
                    <Text
                      style={[
                        styles.historyScore,
                        { color: themeColors.textPrimary },
                      ]}
                    >
                      {result.score} / {result.total}
                    </Text>
                    <Text
                      style={[
                        styles.historyDate,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {formatDate(result.date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.percentBadge,
                      { backgroundColor: getBadgeColor(percentage) },
                    ]}
                  >
                    <Text style={styles.percentBadgeText}>{percentage}%</Text>
                  </View>
                </View>
              );
            })
          )}

          {quizResults.length > 0 ? (
            <Pressable
              onPress={confirmClearQuizHistory}
              style={({ pressed }) => [
                styles.clearButton,
                { borderColor: themeColors.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.clearButtonText}>Tümünü Temizle</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            Ayarlar
          </Text>
        </View>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ThemeSelector
            setThemeMode={setThemeMode}
            themeColors={themeColors}
            themeMode={themeMode}
          />
          <SettingsRow
            danger
            label="Tüm Verileri Sıfırla"
            onPress={confirmResetStore}
            themeColors={themeColors}
          />
          <SettingsRow
            label="Uygulama Hakkında"
            value="1.0.0"
            themeColors={themeColors}
          />
        </View>
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
      />
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, themeColors }) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function SettingsRow({ danger, label, onPress, value, themeColors }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
    >
      <Text
        style={[
          styles.settingsLabel,
          { color: danger ? colors.error : themeColors.textPrimary },
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={[styles.settingsValue, { color: themeColors.textSecondary }]}>
          {value}
        </Text>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={danger ? colors.error : themeColors.textSecondary}
        />
      )}
    </Pressable>
  );
}

function ThemeSelector({ setThemeMode, themeColors, themeMode }) {
  const options = [
    { label: 'Sistem', value: 'system' },
    { label: 'Açık', value: 'light' },
    { label: 'Koyu', value: 'dark' },
  ];

  return (
    <View style={styles.themeSelectorRow}>
      <Text style={[styles.settingsLabel, { color: themeColors.textPrimary }]}>Tema</Text>
      <View style={[styles.segmentedWrap, { borderColor: themeColors.border }]}>
        {options.map((option) => {
          const selected = themeMode === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => setThemeMode(option.value)}
              style={({ pressed }) => [
                styles.segmentButton,
                {
                  backgroundColor: selected ? colors.primary : themeColors.surface,
                  borderColor: selected ? colors.primary : themeColors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  { color: selected ? '#FFFFFF' : themeColors.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  chart: {
    borderRadius: 14,
    marginLeft: -18,
  },
  chartCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    minHeight: 46,
    justifyContent: 'center',
  },
  clearButtonText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 34,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  historyDate: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  historyScore: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  historyScoreWrap: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
  },
  percentBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  percentBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  performanceRow: {
    marginBottom: 16,
  },
  performanceScore: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  performanceSubject: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  performanceTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 16,
  },
  profileTextWrap: {
    flex: 1,
    marginHorizontal: 14,
  },
  progressFill: {
    borderRadius: 4,
    height: '100%',
  },
  progressTrack: {
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  schoolText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 26,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  settingsLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  segmentedWrap: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  settingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  segmentButton: {
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  segmentButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  themeSelectorRow: {
    gap: 10,
    marginBottom: 12,
  },
  settingsValue: {
    fontSize: typography.sizes.sm,
  },
  statCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: '48%',
    marginBottom: 12,
    padding: 14,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: typography.weights.medium,
    marginTop: 4,
  },
  statValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: typography.weights.bold,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  subjectPill: {
    borderRadius: 999,
    maxWidth: 110,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  subjectPillText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
