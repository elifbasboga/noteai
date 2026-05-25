import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [
      shuffled[targetIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function buildQuestions(notes, subject) {
  return notes.flatMap((note) => {
    const noteSubject = note.subject || 'Genel';

    if (subject !== ALL_SUBJECTS && noteSubject !== subject) {
      return [];
    }

    if (!note.questions || Array.isArray(note.questions)) {
      return [];
    }

    const multipleChoice = (note.questions.multipleChoice || []).map(
      (question, index) => ({
        ...question,
        id: `${note.id}_mc_${index}`,
        subject: noteSubject,
        type: 'multipleChoice',
      })
    );
    const trueFalse = (note.questions.trueFalse || []).map((question, index) => ({
      ...question,
      id: `${note.id}_tf_${index}`,
      subject: noteSubject,
      type: 'trueFalse',
    }));

    return [...multipleChoice, ...trueFalse];
  });
}

export default function QuizScreen({ navigation, route }) {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const subject = route.params?.subject || ALL_SUBJECTS;
  const notes = useNotesStore((state) => state.notes);
  const addQuizResult = useNotesStore((state) => state.addQuizResult);
  const [questions, setQuestions] = useState(() =>
    shuffle(buildQuestions(notes, subject))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    restartQuiz();
  }, [subject]);

  const currentQuestion = questions[currentIndex];
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  function restartQuiz() {
    setQuestions(shuffle(buildQuestions(notes, subject)));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsComplete(false);
  }

  function getCorrectAnswer(question) {
    if (question.type === 'multipleChoice') {
      return question.correct;
    }

    return question.answer;
  }

  function selectAnswer(answer) {
    if (selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(answer);
  }

  function goNext() {
    const nextScore =
      selectedAnswer === getCorrectAnswer(currentQuestion) ? score + 1 : score;

    if (currentIndex === questions.length - 1) {
      addQuizResult({
        subject,
        score: nextScore,
        total: questions.length,
        date: new Date().toISOString(),
      });
      setScore(nextScore);
      setIsComplete(true);
      return;
    }

    setScore(nextScore);
    setCurrentIndex((index) => index + 1);
    setSelectedAnswer(null);
  }

  function getOptionStyle(option) {
    if (selectedAnswer === null) {
      return {};
    }

    const optionLetter = option.charAt(0);
    const correct = currentQuestion.correct;

    if (optionLetter === correct) {
      return styles.correctOption;
    }

    if (selectedAnswer === optionLetter) {
      return styles.wrongOption;
    }

    return {};
  }

  function getTrueFalseStyle(value) {
    if (selectedAnswer === null) {
      return {};
    }

    if (value === currentQuestion.answer) {
      return styles.correctOption;
    }

    if (selectedAnswer === value) {
      return styles.wrongOption;
    }

    return {};
  }

  function getPerformanceMessage() {
    if (percentage >= 80) {
      return 'Harika! 🌟';
    }

    if (percentage >= 60) {
      return 'İyi iş! 👍';
    }

    return 'Daha fazla çalış 💪';
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.centerState}>
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
            Bu ders için henüz soru üretilmedi
          </Text>
          <Pressable style={styles.primaryButton} onPress={navigation.goBack}>
            <Text style={styles.primaryButtonText}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.centerState}>
          <Text style={[styles.resultScore, { color: themeColors.textPrimary }]}>
            {score} / {questions.length}
          </Text>
          <View style={[styles.resultTrack, { backgroundColor: themeColors.border }]}>
            <View style={[styles.resultFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={[styles.resultPercent, { color: colors.primary }]}>
            %{percentage}
          </Text>
          <Text style={[styles.resultMessage, { color: themeColors.textPrimary }]}>
            {getPerformanceMessage()}
          </Text>

          <Pressable style={styles.primaryButton} onPress={restartQuiz}>
            <Text style={styles.primaryButtonText}>Tekrar Çöz</Text>
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
          Quiz Modu
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: themeColors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.counter, { color: themeColors.textSecondary }]}>
          Soru {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.questionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {currentQuestion.type === 'multipleChoice'
                ? 'Çoktan Seçmeli'
                : 'Doğru/Yanlış'}
            </Text>
          </View>
          <Text style={[styles.questionText, { color: themeColors.textPrimary }]}>
            {currentQuestion.question}
          </Text>
        </View>

        {currentQuestion.type === 'multipleChoice' ? (
          <View style={styles.optionsStack}>
            {currentQuestion.options.map((option) => {
              const optionLetter = option.charAt(0);

              return (
                <Pressable
                  key={option}
                  onPress={() => selectAnswer(optionLetter)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                    getOptionStyle(option),
                  ]}
                >
                  <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.trueFalseRow}>
            {[true, false].map((value) => (
              <Pressable
                key={`${currentQuestion.id}-${value}`}
                onPress={() => selectAnswer(value)}
                style={[
                  styles.trueFalseButton,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                  getTrueFalseStyle(value),
                ]}
              >
                <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>
                  {value ? 'Doğru' : 'Yanlış'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {selectedAnswer !== null ? (
          <Pressable style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>
              {currentIndex === questions.length - 1 ? 'Sonucu Gör' : 'Sonraki Soru'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
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
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 34,
  },
  correctOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.24)',
    borderColor: colors.success,
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
  optionButton: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 54,
    justifyContent: 'center',
    padding: 14,
  },
  optionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  optionsStack: {
    gap: 10,
    marginBottom: 20,
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
  questionCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  questionText: {
    fontSize: 17,
    fontWeight: typography.weights.bold,
    lineHeight: 25,
    marginTop: 14,
  },
  resultFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  resultMessage: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 24,
    marginTop: 8,
  },
  resultPercent: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: 8,
  },
  resultScore: {
    fontSize: 44,
    fontWeight: typography.weights.bold,
  },
  resultTrack: {
    borderRadius: 999,
    height: 12,
    marginTop: 18,
    overflow: 'hidden',
    width: '100%',
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
  trueFalseButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 72,
  },
  trueFalseRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  wrongOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderColor: colors.error,
  },
});
