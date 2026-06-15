import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../../hooks/useAppTheme';
import useNotesStore from '../../store/useNotesStore';
import { colors, getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function ProfileSetupScreen({ onOnboardingComplete }) {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const setProfile = useNotesStore((state) => state.setProfile);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = name.trim().length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setProfile({
      name: name.trim(),
      university: university.trim(),
      department: department.trim(),
    });

    try {
      await onOnboardingComplete();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            Seni tanıyalım
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            NoteAI çalışma deneyimini sana göre hazırlasın.
          </Text>

          <View style={styles.form}>
            <TextInput
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Adın"
              placeholderTextColor={themeColors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: themeColors.border,
                  color: themeColors.textPrimary,
                  backgroundColor: themeColors.surface,
                },
              ]}
              value={name}
            />
            <TextInput
              autoCapitalize="words"
              onChangeText={setUniversity}
              placeholder="Üniversiten"
              placeholderTextColor={themeColors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: themeColors.border,
                  color: themeColors.textPrimary,
                  backgroundColor: themeColors.surface,
                },
              ]}
              value={university}
            />
            <TextInput
              autoCapitalize="words"
              onChangeText={setDepartment}
              placeholder="Bölümün"
              placeholderTextColor={themeColors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: themeColors.border,
                  color: themeColors.textPrimary,
                  backgroundColor: themeColors.surface,
                },
              ]}
              value={department}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={[
              styles.primaryButton,
              { opacity: canSubmit ? 1 : 0.45 },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Kaydediliyor' : 'Başlayalım'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  footer: {
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  form: {
    marginTop: 32,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: typography.sizes.md,
    marginBottom: 14,
    padding: 14,
  },
  keyboardView: {
    flex: 1,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 54,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  safeArea: {
    flex: 1,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
  },
});
