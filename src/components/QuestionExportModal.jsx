import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../hooks/useAppTheme';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTrueFalseLabels(question) {
  return {
    true: question?.trueFalseLabels?.true || 'Doğru',
    false: question?.trueFalseLabels?.false || 'Yanlış',
  };
}

function getMultipleChoiceCorrectAnswer(question) {
  const correctOption = question.options?.find((option) =>
    option.startsWith(`${question.correct})`)
  );

  if (correctOption) {
    return correctOption;
  }

  return question.correct || '';
}

function buildQuestionExportHtml(note, selectedTypes, includeAnswers) {
  const createdDate = formatDate(note.createdAt);
  const sections = [];
  const answerSections = [];
  const multipleChoice = selectedTypes.multipleChoice
    ? note.questions?.multipleChoice || []
    : [];
  const trueFalse = selectedTypes.trueFalse ? note.questions?.trueFalse || [] : [];
  const openEnded = selectedTypes.openEnded ? note.questions?.openEnded || [] : [];

  if (multipleChoice.length > 0) {
    sections.push(`
      <h2>Çoktan Seçmeli Sorular</h2>
      ${multipleChoice
        .map(
          (question, index) => `
            <div class="question">
              <div><span class="question-num">${index + 1}.</span> ${escapeHtml(question.question)}</div>
              ${(question.options || [])
                .map((option) => `<div class="option">${escapeHtml(option)}</div>`)
                .join('')}
            </div>
          `
        )
        .join('')}
    `);

    if (includeAnswers) {
      answerSections.push(`
        <h2>Çoktan Seçmeli Sorular</h2>
        ${multipleChoice
          .map((question, index) => {
            const correctOption = getMultipleChoiceCorrectAnswer(question);
            return `<div class="answer-item"><span class="answer-correct">${index + 1}. ${escapeHtml(correctOption)}</span></div>`;
          })
          .join('')}
      `);
    }
  }

  if (trueFalse.length > 0) {
    sections.push(`
      <h2>Doğru/Yanlış Sorular</h2>
      ${trueFalse
        .map(
          (question, index) => `
            <div class="question">
              <div><span class="question-num">${index + 1}.</span> ${escapeHtml(question.question)}</div>
            </div>
          `
        )
        .join('')}
    `);

    if (includeAnswers) {
      answerSections.push(`
        <h2>Doğru/Yanlış Sorular</h2>
        ${trueFalse
          .map((question, index) => {
            const labels = getTrueFalseLabels(question);
            const answerLabel = question.answer ? labels.true : labels.false;
            return `<div class="answer-item"><span class="answer-correct">${index + 1}. ${escapeHtml(answerLabel)}</span></div>`;
          })
          .join('')}
      `);
    }
  }

  if (openEnded.length > 0) {
    sections.push(`
      <h2>Açık Uçlu Sorular</h2>
      ${openEnded
        .map(
          (question, index) => `
            <div class="question">
              <div><span class="question-num">${index + 1}.</span> ${escapeHtml(question.question)}</div>
            </div>
          `
        )
        .join('')}
    `);

    if (includeAnswers) {
      answerSections.push(`
        <h2>Açık Uçlu Sorular</h2>
        ${openEnded
          .map((question, index) => {
            return `<div class="answer-item"><span class="answer-correct">${index + 1}. ${escapeHtml(question.answer || '')}</span></div>`;
          })
          .join('')}
      `);
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 40px; color: #111; }
    h1 { color: #7C3AED; font-size: 22px; margin-bottom: 4px; }
    .subject { color: #6B7280; font-size: 13px; margin-bottom: 20px; }
    h2 { color: #7C3AED; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; }
    .question { margin: 16px 0; font-size: 14px; }
    .question-num { font-weight: bold; }
    .option { margin: 4px 0 4px 20px; font-size: 13px; }
    .answer-key { margin-top: 40px; padding-top: 20px; border-top: 2px solid #7C3AED; }
    .answer-key h2 { color: #7C3AED; }
    .answer-item { font-size: 13px; margin: 6px 0; }
    .answer-correct { color: #0F6E56; font-weight: bold; }
    .footer { margin-top: 40px; color: #9CA3AF; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeHtml(note.title)} — Sorular</h1>
  <div class="subject">${escapeHtml(note.subject || 'Genel')} • ${escapeHtml(createdDate)}</div>
  ${sections.join('')}
  ${includeAnswers ? `<div class="answer-key"><h2>Cevap Anahtarı</h2>${answerSections.join('')}</div>` : ''}
  <div class="footer">NoteAI ile oluşturuldu • ${escapeHtml(createdDate)}</div>
</body>
</html>`;
}

function CheckboxRow({ checked, label, onPress, themeColors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? colors.primary : 'transparent',
            borderColor: checked ? colors.primary : themeColors.border,
          },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <Text style={[styles.checkboxLabel, { color: themeColors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

export default function QuestionExportModal({ note, visible, onClose }) {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const [selectedTypes, setSelectedTypes] = useState({
    multipleChoice: true,
    trueFalse: true,
    openEnded: true,
  });
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const availableTypes = useMemo(() => {
    if (!note?.questions || Array.isArray(note.questions)) {
      return {
        multipleChoice: false,
        trueFalse: false,
        openEnded: false,
      };
    }

    return {
      multipleChoice: (note.questions.multipleChoice || []).length > 0,
      trueFalse: (note.questions.trueFalse || []).length > 0,
      openEnded: (note.questions.openEnded || []).length > 0,
    };
  }, [note]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedTypes({
      multipleChoice: availableTypes.multipleChoice,
      trueFalse: availableTypes.trueFalse,
      openEnded: availableTypes.openEnded,
    });
    setIncludeAnswers(true);
    setIsExporting(false);
  }, [availableTypes, visible]);

  if (!note || !note.questions || Array.isArray(note.questions)) {
    return null;
  }

  const hasSelection =
    selectedTypes.multipleChoice || selectedTypes.trueFalse || selectedTypes.openEnded;

  async function handleExport() {
    if (!hasSelection) {
      return;
    }

    setIsExporting(true);

    try {
      const html = buildQuestionExportHtml(note, selectedTypes, includeAnswers);
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert(
          'Paylaşım kullanılamıyor',
          'Bu cihazda PDF paylaşımı desteklenmiyor.'
        );
        return;
      }

      await Sharing.shareAsync(uri);
      onClose();
    } catch (error) {
      Alert.alert('PDF oluşturulamadı', error.message || 'Lütfen tekrar dene.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>İptal</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>PDF'e Dahil Et</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {availableTypes.multipleChoice ? (
            <CheckboxRow
              checked={selectedTypes.multipleChoice}
              label="Çoktan Seçmeli Sorular"
              onPress={() =>
                setSelectedTypes((current) => ({
                  ...current,
                  multipleChoice: !current.multipleChoice,
                }))
              }
              themeColors={themeColors}
            />
          ) : null}

          {availableTypes.trueFalse ? (
            <CheckboxRow
              checked={selectedTypes.trueFalse}
              label="Doğru/Yanlış Sorular"
              onPress={() =>
                setSelectedTypes((current) => ({
                  ...current,
                  trueFalse: !current.trueFalse,
                }))
              }
              themeColors={themeColors}
            />
          ) : null}

          {availableTypes.openEnded ? (
            <CheckboxRow
              checked={selectedTypes.openEnded}
              label="Açık Uçlu Sorular"
              onPress={() =>
                setSelectedTypes((current) => ({
                  ...current,
                  openEnded: !current.openEnded,
                }))
              }
              themeColors={themeColors}
            />
          ) : null}

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={[styles.switchLabel, { color: themeColors.textPrimary }]}>Cevapları Dahil Et</Text>
            </View>
            <Switch
              trackColor={{ false: themeColors.border, true: 'rgba(124, 58, 237, 0.4)' }}
              thumbColor={includeAnswers ? colors.primary : '#FFFFFF'}
              onValueChange={setIncludeAnswers}
              value={includeAnswers}
            />
          </View>

          <Pressable
            disabled={!hasSelection || isExporting}
            onPress={handleExport}
            style={({ pressed }) => [
              styles.primaryButton,
              (!hasSelection || isExporting) && styles.disabledButton,
              pressed && !isExporting && styles.pressed,
            ]}
          >
            {isExporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>PDF Oluştur</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: themeColors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: themeColors.textPrimary }]}>İptal</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cancelText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginLeft: 12,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 54,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  disabledButton: {
    opacity: 0.45,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerButton: {
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 70,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  pressed: {
    opacity: 0.8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 52,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  switchLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    minHeight: 54,
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
});
