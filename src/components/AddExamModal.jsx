import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../hooks/useAppTheme';
import { NotificationService } from '../services/notificationService';
import useNotesStore from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const reminderOptions = [1, 3, 7];
const subjectColors = ['#7C3AED', '#0F6E56', '#854F0B', '#993556', '#185FA5'];

function formatFullDate(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
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

export default function AddExamModal({ visible, onClose }) {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const addExam = useNotesStore((state) => state.addExam);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const canSave = title.trim().length > 0 && date && !saving;

  function resetForm() {
    setTitle('');
    setSubject('');
    setDate(new Date());
    setLocation('');
    setNotes('');
    setReminderDays(3);
    setShowDatePicker(false);
    setSaving(false);
  }

  function closeModal() {
    resetForm();
    onClose();
  }

  function handleDateChange(event, selectedDate) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
    }
  }

  async function saveExam() {
    if (!canSave) {
      return;
    }

    setSaving(true);

    try {
      const trimmedSubject = subject.trim() || 'Genel';
      const exam = {
        id: Date.now().toString(),
        title: title.trim(),
        subject: trimmedSubject,
        date: date.toISOString(),
        location: location.trim(),
        notes: notes.trim(),
        reminderDays,
        notificationId: null,
        color: getSubjectColor(trimmedSubject),
      };
      const hasPermission = await NotificationService.requestPermissions();

      if (hasPermission) {
        exam.notificationId = await NotificationService.scheduleExamReminder(exam);
      } else {
        Alert.alert(
          'Bildirim izni verilmedi',
          'Sınav kaydedildi, ancak hatırlatma bildirimi planlanmadı.'
        );
      }

      addExam(exam);
      closeModal();
    } catch (error) {
      Alert.alert(
        'Sınav kaydedilemedi',
        error.message || 'Lütfen tekrar dene.'
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={closeModal}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <Pressable
            onPress={closeModal}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              İptal
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
            Sınav Ekle
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            onChangeText={setTitle}
            placeholder="Sınav adı"
            placeholderTextColor={themeColors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
              },
            ]}
            value={title}
          />
          <TextInput
            onChangeText={setSubject}
            placeholder="Ders adı"
            placeholderTextColor={themeColors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
              },
            ]}
            value={subject}
          />

          <Pressable
            onPress={() => setShowDatePicker((current) => !current)}
            style={[
              styles.dateButton,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={[styles.dateText, { color: themeColors.textPrimary }]}>
              {formatFullDate(date)}
            </Text>
          </Pressable>

          {showDatePicker ? (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              mode="date"
              onChange={handleDateChange}
              value={date}
            />
          ) : null}

          <TextInput
            onChangeText={setLocation}
            placeholder="Sınav yeri (opsiyonel)"
            placeholderTextColor={themeColors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
              },
            ]}
            value={location}
          />
          <TextInput
            multiline
            onChangeText={setNotes}
            placeholder="Notlar (opsiyonel)"
            placeholderTextColor={themeColors.textSecondary}
            style={[
              styles.input,
              styles.notesInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
              },
            ]}
            textAlignVertical="top"
            value={notes}
          />

          <Text style={[styles.label, { color: themeColors.textPrimary }]}>
            Ne zaman hatırlatayım?
          </Text>
          <View style={styles.reminderRow}>
            {reminderOptions.map((option) => {
              const selected = reminderDays === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setReminderDays(option)}
                  style={({ pressed }) => [
                    styles.reminderPill,
                    {
                      backgroundColor: selected ? colors.primary : 'transparent',
                      borderColor: selected ? colors.primary : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderText,
                      {
                        color: selected ? '#FFFFFF' : themeColors.textSecondary,
                      },
                    ]}
                  >
                    {option} gün önce
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={!canSave}
            onPress={saveExam}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave && styles.disabled,
              pressed && canSave && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Kaydet</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cancelText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  dateButton: {
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 14,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  disabled: {
    opacity: 0.45,
  },
  footer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
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
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: typography.sizes.md,
    marginBottom: 14,
    padding: 14,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  reminderPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 54,
    width: '100%',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
});
