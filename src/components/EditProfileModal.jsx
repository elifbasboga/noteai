import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotesStore } from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function EditProfileModal({ visible, onClose }) {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const profile = useNotesStore((state) => state.profile);
  const setProfile = useNotesStore((state) => state.setProfile);
  const [name, setName] = useState(profile.name || '');
  const [university, setUniversity] = useState(profile.university || '');
  const [department, setDepartment] = useState(profile.department || '');
  const canSave = name.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setName(profile.name || '');
      setUniversity(profile.university || '');
      setDepartment(profile.department || '');
    }
  }, [profile, visible]);

  function saveProfile() {
    if (!canSave) {
      return;
    }

    setProfile({
      name: name.trim(),
      university: university.trim(),
      department: department.trim(),
    });
    onClose();
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
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              İptal
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
            Profili Düzenle
          </Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.content}>
          <TextInput
            autoCapitalize="words"
            onChangeText={setName}
            placeholder="Adın"
            placeholderTextColor={themeColors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
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
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
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
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.textPrimary,
              },
            ]}
            value={department}
          />

          <Pressable
            disabled={!canSave}
            onPress={saveProfile}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave && styles.disabled,
              pressed && canSave && styles.pressed,
            ]}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
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
  disabled: {
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
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: typography.sizes.md,
    marginBottom: 14,
    padding: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 54,
    width: '100%',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
});
