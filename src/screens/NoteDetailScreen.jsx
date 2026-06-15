import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../hooks/useAppTheme';
import { useAI } from '../hooks/useAI';
import { ApiService } from '../services/api';
import QuestionExportModal from '../components/QuestionExportModal';
import useNotesStore from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const subjectColors = ['#7C3AED', '#0F6E56', '#854F0B', '#993556', '#185FA5'];
const conceptColors = ['#7C3AED', '#0F6E56', '#854F0B', '#993556', '#185FA5'];
const questionTypeOptions = [
  {
    value: 'multipleChoice',
    title: 'Test (Çoktan Seçmeli)',
    description: 'Yalnızca çoktan seçmeli sorular',
  },
  {
    value: 'trueFalse',
    title: 'Doğru/Yanlış',
    description: 'Yalnızca doğru/yanlış soruları',
  },
  {
    value: 'openEnded',
    title: 'Klasik (Açık Uçlu)',
    description: 'Yanıtlı açık uçlu sorular',
  },
  {
    value: 'mixed',
    title: 'Karışık',
    description: 'Tüm soru türleri',
  },
];

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function withOpacity(hexColor, opacity) {
  const normalized = hexColor.replace('#', '');
  const numeric = Number.parseInt(normalized, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function detectQuestionLanguage(text) {
  const normalized = String(text || '').toLowerCase();
  if (!normalized.trim()) {
    return 'en';
  }

  if (/[çğıöşüÇĞİÖŞÜ]/.test(normalized)) {
    return 'tr';
  }

  const turkishSignals = [
    ' ve ',
    ' bir ',
    ' bu ',
    ' için ',
    ' ile ',
    ' nasıl ',
    ' neden ',
    ' hangi ',
    ' nedir ',
  ];

  if (turkishSignals.some((signal) => normalized.includes(signal))) {
    return 'tr';
  }

  return 'en';
}

function getTrueFalseLabels(question) {
  return {
    true: question?.trueFalseLabels?.true || 'Doğru',
    false: question?.trueFalseLabels?.false || 'Yanlış',
  };
}

function formatCreatedDate(value) {
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

function buildSummaryText(note) {
  const concepts = note.summary.keyConcepts || [];
  const terms = note.summary.importantTerms || [];

  return `📚 ${note.title} — ${note.subject || 'Genel'}

ÖZET
${note.summary.overview}

ANAHTAR KAVRAMLAR
${concepts.map((concept) => `• ${concept}`).join('\n')}

ÖNEMLİ TERİMLER
${terms.map((item) => `• ${item.term}: ${item.definition}`).join('\n')}

NoteAI ile oluşturuldu`;
}

function buildFlashcardsText(note) {
  return `🃏 ${note.subject || 'Genel'} Flashcardları

${note.flashcards
  .map((card, index) => `${index + 1}. S: ${card.front}
   C: ${card.back}`)
  .join('\n\n')}

NoteAI ile oluşturuldu`;
}

function buildNoteHtml(note) {
  const createdDate = formatCreatedDate(note.createdAt);
  const concepts = note.summary?.keyConcepts || [];
  const terms = note.summary?.importantTerms || [];
  const flashcards = note.flashcards || [];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 40px; color: #111; }
    h1 { color: #7C3AED; font-size: 24px; margin-bottom: 4px; }
    .subject { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
    .date { color: #9CA3AF; font-size: 12px; }
    h2 { color: #7C3AED; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; }
    .content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    ul { padding-left: 20px; }
    li { margin: 4px 0; font-size: 14px; }
    .term { font-weight: bold; }
    .qa { margin-bottom: 14px; }
    .footer { margin-top: 40px; color: #9CA3AF; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeHtml(note.title)}</h1>
  <div class="subject">${escapeHtml(note.subject || 'Genel')}</div>
  <div class="date">${escapeHtml(createdDate)}</div>

  ${
    note.content
      ? `<h2>Not İçeriği</h2>
  <div class="content">${escapeHtml(note.content)}</div>`
      : ''
  }

  ${
    note.summary
      ? `<h2>Özet</h2>
  <p>${escapeHtml(note.summary.overview || '')}</p>

  <h2>Anahtar Kavramlar</h2>
  <ul>${concepts.map((concept) => `<li>${escapeHtml(concept)}</li>`).join('')}</ul>

  <h2>Önemli Terimler</h2>
  ${terms
    .map(
      (item) =>
        `<p><span class="term">${escapeHtml(item.term)}:</span> ${escapeHtml(
          item.definition
        )}</p>`
    )
    .join('')}`
      : ''
  }

  ${
    flashcards.length > 0
      ? `<h2>Flashcardlar (${flashcards.length})</h2>
  ${flashcards
    .map(
      (card, index) => `<div class="qa">
    <p><span class="term">${index + 1}. S:</span> ${escapeHtml(card.front)}</p>
    <p><span class="term">C:</span> ${escapeHtml(card.back)}</p>
  </div>`
    )
    .join('')}`
      : ''
  }

  <div class="footer">NoteAI ile oluşturuldu • ${escapeHtml(createdDate)}</div>
</body>
</html>`;
}

function Flashcard({ card, index, themeColors }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  function flipCard() {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 35,
      useNativeDriver: true,
    }).start();
    setIsFlipped((current) => !current);
  }

  const frontRotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Pressable onPress={flipCard} style={styles.flashcardWrap}>
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
        <Text style={[styles.flashcardLabel, { color: colors.primary }]}>
          Kart {index + 1}
        </Text>
        <Text style={[styles.flashcardText, { color: themeColors.textPrimary }]}>
          {card.front}
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.flashcard,
          styles.flashcardBack,
          {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            transform: [{ rotateY: backRotate }],
          },
        ]}
      >
        <Text style={styles.flashcardBackLabel}>Cevap</Text>
        <Text style={styles.flashcardBackText}>{card.back}</Text>
      </Animated.View>
    </Pressable>
  );
}

function ImportantTermItem({ isExpanded, item, onToggle, themeColors, isLast }) {
  const rotation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isExpanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotation]);

  const chevronRotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View
      style={[
        styles.termItem,
        !isLast && {
          borderBottomColor: themeColors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Pressable onPress={onToggle} style={styles.termHeader}>
        <Text style={[styles.termTitle, { color: themeColors.textPrimary }]}>
          {item.term}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons
            name="chevron-down"
            size={18}
            color={themeColors.textSecondary}
          />
        </Animated.View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.termDefinitionWrap}>
          <Text style={[styles.termDefinition, { color: themeColors.textSecondary }]}>
            {item.definition}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function NoteDetailScreen({ navigation, route }) {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const noteId = route.params?.noteId;
  const note = useNotesStore((state) =>
    state.notes.find((item) => item.id === noteId)
  );
  const updateNote = useNotesStore((state) => state.updateNote);
  const {
    error,
    summarize,
    generateQuestions,
    generateFlashcards,
  } = useAI();
  const [activeAction, setActiveAction] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [questionTypeSheetVisible, setQuestionTypeSheetVisible] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState('mixed');
  const [selectedQuestionLanguage, setSelectedQuestionLanguage] = useState(
    detectQuestionLanguage(note?.content || note?.title || note?.subject || '')
  );
  const [expandedTerms, setExpandedTerms] = useState({});
  const [questionExportVisible, setQuestionExportVisible] = useState(false);
  const summaryConcepts = note?.summary?.keyConcepts || [];
  const importantTerms = note?.summary?.importantTerms || [];

  const subjectColor = useMemo(() => {
    if (!note?.subject) {
      return subjectColors[0];
    }

    const index = note.subject
      .split('')
      .reduce((total, char) => total + char.charCodeAt(0), 0);
    return subjectColors[index % subjectColors.length];
  }, [note?.subject]);

  if (!note) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.missingWrap}>
          <Text style={[styles.missingText, { color: themeColors.textPrimary }]}>
            Not bulunamadı
          </Text>
          <Pressable style={styles.primaryButton} onPress={navigation.goBack}>
            <Text style={styles.primaryButtonText}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isBusy = Boolean(activeAction);
  const visibleError = localError || error;

  async function getSourceTextForAI() {
    const existingText = note.content?.trim();

    if (existingText) {
      return existingText;
    }

    if (note.fileType === 'pdf' && note.fileUri) {
      const extractedText = await ApiService.extractText(note.fileUri, 'pdf');
      const normalizedText = extractedText?.trim();

      if (normalizedText) {
        updateNote(note.id, { content: normalizedText });
        return normalizedText;
      }

      throw new Error('PDF içeriği okunamadı. Lütfen metin içeren bir PDF yükle.');
    }

    throw new Error('AI işlemleri için önce not içeriği eklemelisin.');
  }

  async function runAIAction(
    actionName,
    questionType = 'mixed',
    language = selectedQuestionLanguage
  ) {
    setLocalError(null);
    setLastAction({ name: actionName, questionType, language });
    setActiveAction(actionName);

    try {
      const sourceText = await getSourceTextForAI();

      if (actionName === 'summary') {
        const summary = await summarize(sourceText, note.subject || 'Genel');

        if (summary) {
          updateNote(note.id, { summary });
        }
      }

      if (actionName === 'questions') {
        const questions = await generateQuestions(
          sourceText,
          note.subject || 'Genel',
          questionType,
          language
        );

        if (questions) {
          updateNote(note.id, { questions });
          setSelectedAnswers({});
        }
      }

      if (actionName === 'flashcards') {
        const flashcards = await generateFlashcards(
          sourceText,
          note.subject || 'Genel'
        );

        if (flashcards) {
          updateNote(note.id, { flashcards });
        }
      }
    } catch (actionError) {
      setLocalError(actionError.message || 'AI işlemi başarısız oldu.');
    } finally {
      setActiveAction(null);
    }
  }

  function retryLastAction() {
    if (lastAction) {
      runAIAction(
        lastAction.name,
        lastAction.questionType,
        lastAction.language || selectedQuestionLanguage
      );
    }
  }

  function toggleContent() {
    LayoutAnimation.easeInEaseOut();
    setIsContentExpanded((current) => !current);
  }

  function openQuestionTypeSheet() {
    setSelectedQuestionLanguage(
      detectQuestionLanguage(note?.content || note?.title || note?.subject || '')
    );
    setQuestionTypeSheetVisible(true);
  }

  function confirmQuestionGeneration() {
    setQuestionTypeSheetVisible(false);
    runAIAction('questions', selectedQuestionType, selectedQuestionLanguage);
  }

  function confirmDeleteSummary() {
    Alert.alert('Sil', 'Bu özeti silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => updateNote(note.id, { summary: null }),
      },
    ]);
  }

  function confirmDeleteQuestions() {
    Alert.alert('Sil', 'Bu soruları silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => updateNote(note.id, { questions: null }),
      },
    ]);
  }

  function confirmDeleteFlashcards() {
    Alert.alert('Sil', 'Bu flashcardları silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => updateNote(note.id, { flashcards: [] }),
      },
    ]);
  }

  function selectAnswer(key, value) {
    setSelectedAnswers((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function getMcOptionStyle(questionIndex, option) {
    const key = `mc-${questionIndex}`;
    const selected = selectedAnswers[key];

    if (!selected) {
      return {};
    }

    const correct = note.questions.multipleChoice[questionIndex].correct;
    const optionLetter = option.charAt(0);

    if (optionLetter === correct) {
      return styles.correctOption;
    }

    if (selected === optionLetter) {
      return styles.wrongOption;
    }

    return {};
  }

  function getTrueFalseStyle(questionIndex, value) {
    const key = `tf-${questionIndex}`;
    const selected = selectedAnswers[key];

    if (selected === undefined) {
      return {};
    }

    const correct = note.questions.trueFalse[questionIndex].answer;

    if (value === correct) {
      return styles.correctOption;
    }

    if (selected === value) {
      return styles.wrongOption;
    }

    return {};
  }

  async function shareSummary() {
    if (!note.summary) {
      Alert.alert('Önce özet oluştur');
      return;
    }

    try {
      await Share.share({ message: buildSummaryText(note) });
      setShareSheetVisible(false);
    } catch (shareError) {
      Alert.alert('Paylaşım başarısız', shareError.message || 'Lütfen tekrar dene.');
    }
  }

  async function exportPdf() {
    setExportingPdf(true);

    try {
      const { uri } = await Print.printToFileAsync({
        html: buildNoteHtml(note),
      });
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Paylaşım kullanılamıyor', 'Bu cihazda dosya paylaşımı desteklenmiyor.');
        return;
      }

      await Sharing.shareAsync(uri);
      setShareSheetVisible(false);
    } catch (exportError) {
      Alert.alert(
        'PDF oluşturulamadı',
        exportError.message || 'Lütfen tekrar dene.'
      );
    } finally {
      setExportingPdf(false);
    }
  }

  async function shareFlashcards() {
    if (!note.flashcards?.length) {
      Alert.alert('Önce flashcard oluştur');
      return;
    }

    try {
      await Share.share({ message: buildFlashcardsText(note) });
      setShareSheetVisible(false);
    } catch (shareError) {
      Alert.alert('Paylaşım başarısız', shareError.message || 'Lütfen tekrar dene.');
    }
  }

  function toggleTerm(termKey) {
    LayoutAnimation.easeInEaseOut();
    setExpandedTerms((current) => ({
      ...current,
      [termKey]: !current[termKey],
    }));
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable onPress={navigation.goBack} style={styles.headerIconButton}>
          <Ionicons name="chevron-back" size={26} color={themeColors.textPrimary} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: themeColors.textPrimary }]}
          numberOfLines={1}
        >
          {note.title}
        </Text>
        <Pressable
          onPress={() => setShareSheetVisible(true)}
          style={styles.headerIconButton}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={themeColors.textPrimary}
          />
        </Pressable>
      </View>

      {visibleError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{visibleError}</Text>
          <Pressable onPress={retryLastAction} style={styles.retryButton}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.infoHeader}>
            <View style={[styles.subjectPill, { backgroundColor: subjectColor }]}>
              <Text style={styles.subjectText}>{note.subject || 'Genel'}</Text>
            </View>
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {formatCreatedDate(note.createdAt)}
            </Text>
          </View>

          {note.content ? (
            <View>
              <Text
                numberOfLines={isContentExpanded ? undefined : 3}
                style={[styles.noteContent, { color: themeColors.textPrimary }]}
              >
                {note.content}
              </Text>
              <Pressable
                onPress={toggleContent}
                style={({ pressed }) => [
                  styles.contentToggle,
                  pressed && styles.sheetPressed,
                ]}
              >
                <Text style={styles.contentToggleText}>
                  {isContentExpanded ? 'İçeriği Gizle ▲' : 'İçeriği Göster ▼'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {note.fileUri ? (
            <View style={styles.fileRow}>
              <Ionicons
                name="attach-outline"
                size={18}
                color={themeColors.textSecondary}
              />
              <Text
                style={[styles.fileName, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {note.fileName}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            disabled={isBusy}
            onPress={() => runAIAction('summary')}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.primary },
              (pressed || isBusy) && styles.actionPressed,
            ]}
          >
            {activeAction === 'summary' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.actionText}>Özetle</Text>
          </Pressable>
          <Pressable
            disabled={isBusy}
            onPress={openQuestionTypeSheet}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: '#185FA5' },
              (pressed || isBusy) && styles.actionPressed,
            ]}
          >
            {activeAction === 'questions' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="help-circle-outline" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.actionText}>Sorular Üret</Text>
          </Pressable>
          <Pressable
            disabled={isBusy}
            onPress={() => runAIAction('flashcards')}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: '#0F6E56' },
              (pressed || isBusy) && styles.actionPressed,
            ]}
          >
            {activeAction === 'flashcards' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="albums-outline" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.actionText}>Flashcard Oluştur</Text>
          </Pressable>
        </View>

        {isBusy ? (
          <View style={styles.aiLoading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.aiLoadingText, { color: themeColors.textSecondary }]}>
              AI çalışıyor...
            </Text>
          </View>
        ) : null}

        {note.summary ? (
          <View style={styles.summarySection}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitleText, { color: themeColors.textPrimary }]}> 
                  Özet
                </Text>
              </View>
              <Pressable
                onPress={confirmDeleteSummary}
                hitSlop={8}
                style={({ pressed }) => [styles.deleteIconButton, pressed && styles.sheetPressed]}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>

            <View style={styles.summaryBlock}>
            <View
              style={[
                styles.overviewCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2A2150' : '#F5F3FF',
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={18}
                color={colors.primary}
                style={styles.summaryCardIcon}
              />
              <Text style={[styles.summaryEyebrow, { color: themeColors.textSecondary }]}> 
                GENEL BAKIŞ
              </Text>
              <Text style={[styles.summaryOverview, { color: themeColors.textPrimary }]}> 
                {note.summary.overview}
              </Text>
            </View>

            <View style={styles.summarySectionSpacing}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="key" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitleText, { color: themeColors.textPrimary }]}> 
                  Anahtar Kavramlar
                </Text>
              </View>
              <View style={styles.conceptWrap}>
                {summaryConcepts.map((concept, index) => {
                  const chipColor = conceptColors[index % conceptColors.length];

                  return (
                    <View
                      key={`${concept}-${index}`}
                      style={[
                        styles.conceptChip,
                        {
                          backgroundColor: withOpacity(chipColor, 0.15),
                          borderColor: chipColor,
                        },
                      ]}
                    >
                      <Text style={[styles.conceptChipText, { color: chipColor }]}>
                        {concept}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.summarySectionSpacing}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="book" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitleText, { color: themeColors.textPrimary }]}> 
                  Önemli Terimler
                </Text>
              </View>
              <View style={[styles.termList, { borderColor: themeColors.border }]}> 
                {importantTerms.map((item, index) => {
                  const termKey = `${item.term}-${index}`;
                  const isExpanded = Boolean(expandedTerms[termKey]);

                  return (
                    <ImportantTermItem
                      key={termKey}
                      isExpanded={isExpanded}
                      item={item}
                      isLast={index === importantTerms.length - 1}
                      onToggle={() => toggleTerm(termKey)}
                      themeColors={themeColors}
                    />
                  );
                })}
              </View>
            </View>
            </View>
          </View>
        ) : null}

        {note.questions && !Array.isArray(note.questions) ? (
          <View
            style={[
              styles.section,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.sectionHeaderWithAction}>
              <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}> 
                Sorular
              </Text>
              <Pressable
                onPress={confirmDeleteQuestions}
                hitSlop={8}
                style={({ pressed }) => [styles.deleteIconButton, pressed && styles.sheetPressed]}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>

            {note.questions.multipleChoice?.map((question, questionIndex) => (
              <View key={question.question} style={styles.questionBlock}>
                <Text style={[styles.questionText, { color: themeColors.textPrimary }]}>
                  {questionIndex + 1}. {question.question}
                </Text>
                {question.options.map((option) => {
                  const optionLetter = option.charAt(0);

                  return (
                    <Pressable
                      key={option}
                      onPress={() => selectAnswer(`mc-${questionIndex}`, optionLetter)}
                      style={[
                        styles.optionButton,
                        {
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                        },
                        getMcOptionStyle(questionIndex, option),
                      ]}
                    >
                      <Text
                        style={[styles.optionText, { color: themeColors.textPrimary }]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {note.questions.trueFalse?.map((question, questionIndex) => (
              <View key={question.question} style={styles.questionBlock}>
                <Text style={[styles.questionText, { color: themeColors.textPrimary }]}>
                  {question.question}
                </Text>
                <View style={styles.trueFalseRow}>
                  {[true, false].map((value) => (
                    <Pressable
                      key={`${question.question}-${value}`}
                      onPress={() => selectAnswer(`tf-${questionIndex}`, value)}
                      style={[
                        styles.trueFalseButton,
                        {
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                        },
                        getTrueFalseStyle(questionIndex, value),
                      ]}
                    >
                      <Text
                        style={[styles.optionText, { color: themeColors.textPrimary }]}
                      >
                        {value ? getTrueFalseLabels(question).true : getTrueFalseLabels(question).false}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            {note.questions.openEnded?.map((question, index) => (
              <View key={question.question} style={styles.openQuestion}>
                <Text style={[styles.questionText, { color: themeColors.textPrimary }]}>
                  Açık uçlu {index + 1}
                </Text>
                <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
                  {question.question}
                </Text>
                {question.answer ? (
                  <View style={styles.openAnswerBox}>
                    <Text style={styles.openAnswerLabel}>Model cevap</Text>
                    <Text style={styles.openAnswerText}>{question.answer}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {note.flashcards?.length > 0 ? (
          <View style={styles.flashcardSection}>
            <View style={styles.sectionHeaderWithAction}>
              <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}> 
                Flashcardlar
              </Text>
              <Pressable
                onPress={confirmDeleteFlashcards}
                hitSlop={8}
                style={({ pressed }) => [styles.deleteIconButton, pressed && styles.sheetPressed]}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {note.flashcards.map((card, index) => (
                <Flashcard
                  key={`${card.front}-${index}`}
                  card={card}
                  index={index}
                  themeColors={themeColors}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('Chat', { noteId: note.id })}
        style={({ pressed }) => [styles.chatFab, pressed && styles.sheetPressed]}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFFFFF" />
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setQuestionTypeSheetVisible(false)}
        transparent
        visible={questionTypeSheetVisible}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setQuestionTypeSheetVisible(false)}
        >
          <Pressable
            style={[styles.shareSheet, { backgroundColor: themeColors.surface }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: themeColors.textPrimary }]}>
              Soru Türü Seç
            </Text>

            <Text style={[styles.selectorGroupLabel, { color: themeColors.textSecondary }]}> 
              Soru Dili Seç
            </Text>
            <View style={styles.selectorGroup}>
              {[
                { label: 'Türkçe', value: 'tr' },
                { label: 'İngilizce', value: 'en' },
              ].map((option) => {
                const selected = selectedQuestionLanguage === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedQuestionLanguage(option.value)}
                    style={({ pressed }) => [
                      styles.questionTypeOption,
                      {
                        flex: 1,
                        borderColor: selected ? colors.primary : themeColors.border,
                        backgroundColor: selected
                          ? 'rgba(124, 58, 237, 0.12)'
                          : themeColors.background,
                      },
                      pressed && styles.sheetPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: selected ? colors.primary : themeColors.border },
                      ]}
                    >
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.questionTypeTextWrap}>
                      <Text
                        style={[
                          styles.questionTypeTitle,
                          { color: themeColors.textPrimary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.selectorGroupLabel, { color: themeColors.textSecondary }]}> 
              Soru Türü Seç
            </Text>

            {questionTypeOptions.map((option) => {
              const selected = selectedQuestionType === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedQuestionType(option.value)}
                  style={({ pressed }) => [
                    styles.questionTypeOption,
                    {
                      borderColor: selected ? colors.primary : themeColors.border,
                      backgroundColor: selected
                        ? 'rgba(124, 58, 237, 0.12)'
                        : themeColors.background,
                    },
                    pressed && styles.sheetPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: selected ? colors.primary : themeColors.border },
                    ]}
                  >
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={styles.questionTypeTextWrap}>
                    <Text
                      style={[
                        styles.questionTypeTitle,
                        { color: themeColors.textPrimary },
                      ]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.questionTypeDescription,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              onPress={confirmQuestionGeneration}
              style={({ pressed }) => [
                styles.sheetClose,
                pressed && styles.sheetPressed,
              ]}
            >
              <Text style={styles.sheetCloseText}>Üret</Text>
            </Pressable>
            <Pressable
              onPress={() => setQuestionTypeSheetVisible(false)}
              style={({ pressed }) => [
                styles.cancelSheetButton,
                { borderColor: themeColors.border },
                pressed && styles.sheetPressed,
              ]}
            >
              <Text
                style={[
                  styles.cancelSheetText,
                  { color: themeColors.textPrimary },
                ]}
              >
                İptal
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setShareSheetVisible(false)}
        transparent
        visible={shareSheetVisible}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setShareSheetVisible(false)}
        >
          <Pressable
            style={[
              styles.shareSheet,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: themeColors.textPrimary }]}>
              Paylaş ve Dışa Aktar
            </Text>

            <Pressable
              onPress={shareSummary}
              style={({ pressed }) => [
                styles.sheetOption,
                { borderColor: themeColors.border },
                pressed && styles.sheetPressed,
              ]}
            >
              <Ionicons name="share-social-outline" size={22} color={colors.primary} />
              <Text style={[styles.sheetOptionText, { color: themeColors.textPrimary }]}>
                Özeti Paylaş
              </Text>
            </Pressable>

            <Pressable
              disabled={exportingPdf}
              onPress={exportPdf}
              style={({ pressed }) => [
                styles.sheetOption,
                { borderColor: themeColors.border },
                (pressed || exportingPdf) && styles.sheetPressed,
              ]}
            >
              {exportingPdf ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Ionicons name="document-outline" size={22} color={colors.primary} />
              )}
              <Text style={[styles.sheetOptionText, { color: themeColors.textPrimary }]}>
                {exportingPdf ? 'PDF hazırlanıyor...' : 'PDF Olarak Dışa Aktar'}
              </Text>
            </Pressable>

            <Pressable
              onPress={shareFlashcards}
              style={({ pressed }) => [
                styles.sheetOption,
                { borderColor: themeColors.border },
                pressed && styles.sheetPressed,
              ]}
            >
              <Ionicons name="albums-outline" size={22} color={colors.primary} />
              <Text style={[styles.sheetOptionText, { color: themeColors.textPrimary }]}>
                Flashcardları Paylaş
              </Text>
            </Pressable>

            {note.questions ? (
              <Pressable
                onPress={() => {
                  setShareSheetVisible(false);
                  setQuestionExportVisible(true);
                }}
                style={({ pressed }) => [
                  styles.sheetOption,
                  { borderColor: themeColors.border },
                  pressed && styles.sheetPressed,
                ]}
              >
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                <Text
                  style={[styles.sheetOptionText, { color: themeColors.textPrimary }]}
                >
                  Soruları PDF Olarak Aktar
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => setShareSheetVisible(false)}
              style={({ pressed }) => [
                styles.sheetClose,
                pressed && styles.sheetPressed,
              ]}
            >
              <Text style={styles.sheetCloseText}>Kapat</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <QuestionExportModal
        note={note}
        onClose={() => setQuestionExportVisible(false)}
        visible={questionExportVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 74,
    paddingHorizontal: 8,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 6,
    textAlign: 'center',
  },
  aiLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  aiLoadingText: {
    fontSize: typography.sizes.md,
    marginTop: 8,
  },
  bodyText: {
    fontSize: typography.sizes.md,
    lineHeight: 23,
  },
  bulletText: {
    fontSize: typography.sizes.md,
    lineHeight: 23,
    marginTop: 6,
  },
  conceptChip: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  conceptChipText: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  conceptWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cancelSheetButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 48,
  },
  cancelSheetText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  chatFab: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    bottom: 24,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    width: 56,
  },
  container: {
    flex: 1,
  },
  contentToggle: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 6,
  },
  contentToggleText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: 18,
    paddingBottom: 100,
  },
  correctOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderColor: colors.success,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: colors.error,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  fileName: {
    flex: 1,
    fontSize: typography.sizes.sm,
    marginLeft: 6,
  },
  fileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  overviewCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
  },
  flashcard: {
    backfaceVisibility: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    height: 180,
    justifyContent: 'center',
    left: 0,
    padding: 18,
    position: 'absolute',
    top: 0,
    width: 240,
  },
  flashcardBack: {
    position: 'absolute',
  },
  flashcardBackLabel: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 10,
  },
  flashcardBackText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  flashcardLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 10,
  },
  flashcardSection: {
    marginTop: 4,
  },
  flashcardText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    lineHeight: 23,
  },
  flashcardWrap: {
    height: 180,
    marginRight: 14,
    marginTop: 12,
    width: 240,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  infoHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  missingText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 18,
  },
  missingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  noteContent: {
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  openAnswerBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: colors.success,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    padding: 12,
  },
  openAnswerLabel: {
    color: colors.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  openAnswerText: {
    color: colors.success,
    fontSize: typography.sizes.sm,
    lineHeight: 21,
  },
  openQuestion: {
    borderTopColor: 'rgba(156, 163, 175, 0.28)',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    marginTop: 14,
  },
  optionButton: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  optionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  questionBlock: {
    marginTop: 16,
  },
  questionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    lineHeight: 23,
    marginBottom: 8,
  },
  questionTypeDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    marginTop: 2,
  },
  questionTypeOption: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  questionTypeTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  questionTypeTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
  },
  radioInner: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  radioOuter: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  retryButton: {
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  section: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeaderWithAction: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
  },
  deleteIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 28,
  },
  summaryBlock: {
    gap: 16,
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryCardIcon: {
    marginBottom: 10,
  },
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  summaryOverview: {
    fontSize: 15,
    lineHeight: 22,
  },
  summarySectionSpacing: {
    marginTop: 16,
  },
  shareSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 30,
  },
  sheetClose: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 50,
  },
  sheetCloseText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#9CA3AF',
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    opacity: 0.6,
    width: 44,
  },
  sheetOption: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 56,
  },
  sheetOptionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginLeft: 12,
  },
  sheetOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetPressed: {
    opacity: 0.75,
  },
  sheetTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 8,
  },
  selectorGroupLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  selectorGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  subjectPill: {
    borderRadius: 999,
    maxWidth: '58%',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  termDefinition: {
    fontSize: 13,
    lineHeight: 19,
  },
  termDefinitionWrap: {
    paddingLeft: 12,
    paddingTop: 8,
  },
  termHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  termItem: {
    paddingVertical: 10,
  },
  termList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  termTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    paddingRight: 10,
  },
  subsectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: 18,
  },
  termText: {
    fontSize: typography.sizes.md,
    lineHeight: 23,
    marginTop: 8,
  },
  trueFalseButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  trueFalseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  wrongOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: colors.error,
  },
});
