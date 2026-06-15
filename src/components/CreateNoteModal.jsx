import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
import { useAI } from '../hooks/useAI';
import useNotesStore from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

function getNameFromUri(uri, fallback) {
  if (!uri) {
    return fallback;
  }

  const path = uri.split('?')[0];
  const name = path.split('/').pop();
  return name || fallback;
}

export default function CreateNoteModal({ visible, onClose }) {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const addNote = useNotesStore((state) => state.addNote);
  const { loading: ocrLoading, error: ocrError, extractText } = useAI();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [pickedFile, setPickedFile] = useState(null);
  const [ocrAttempted, setOcrAttempted] = useState(false);
  const canSave = title.trim().length > 0 && !ocrLoading;

  useEffect(() => {
    if (ocrError && ocrAttempted) {
      Alert.alert('OCR başarısız', ocrError);
      setOcrAttempted(false);
    }
  }, [ocrAttempted, ocrError]);

  function resetForm() {
    setTitle('');
    setSubject('');
    setContent('');
    setPickedFile(null);
    setOcrAttempted(false);
  }

  function closeModal() {
    resetForm();
    onClose();
  }

  async function enrichFileInfo(file) {
    try {
      const info = new File(file.uri).info();
      return {
        ...file,
        exists: info.exists,
      };
    } catch {
      return file;
    }
  }

  async function pickPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: 'application/pdf',
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];

    if (!asset) {
      return;
    }

    const file = await enrichFileInfo({
      uri: asset.uri,
      name: asset.name || getNameFromUri(asset.uri, 'not.pdf'),
      type: 'pdf',
    });

    setPickedFile(file);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'İzin gerekli',
        'Fotoğraf eklemek için galeri erişimine izin vermelisin.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];

    if (!asset) {
      return;
    }

    const file = await enrichFileInfo({
      uri: asset.uri,
      name: asset.fileName || getNameFromUri(asset.uri, 'fotoğraf.jpg'),
      type: 'image',
    });

    setPickedFile(file);
  }

  async function applyOcr() {
    if (!pickedFile) {
      return;
    }

    setOcrAttempted(true);
    const extractedText = await extractText(pickedFile.uri, pickedFile.type);

    if (extractedText) {
      setContent(extractedText);
      setOcrAttempted(false);
    }
  }

  function saveNote() {
    if (!canSave) {
      return;
    }

    addNote({
      id: Date.now().toString(),
      title: title.trim(),
      subject: subject.trim(),
      content: content.trim(),
      fileUri: pickedFile?.uri ?? null,
      fileType: pickedFile?.type ?? null,
      fileName: pickedFile?.name ?? null,
      createdAt: new Date().toISOString(),
      summary: null,
      flashcards: [],
      questions: [],
    });
    closeModal();
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <Pressable
              onPress={closeModal}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.primary }]}>
                İptal
              </Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
              Yeni Not
            </Text>
            <View style={styles.headerButton} />
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              onChangeText={setTitle}
              placeholder="Başlık"
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
            <TextInput
              multiline
              onChangeText={setContent}
              placeholder="Not içeriği"
              placeholderTextColor={themeColors.textSecondary}
              style={[
                styles.input,
                styles.contentInput,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.textPrimary,
                },
              ]}
              textAlignVertical="top"
              value={content}
            />

            <View style={styles.uploadRow}>
              <Pressable
                onPress={pickPdf}
                style={({ pressed }) => [
                  styles.uploadButton,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
                <Text style={[styles.uploadText, { color: themeColors.textPrimary }]}>
                  PDF Yükle
                </Text>
              </Pressable>
              <Pressable
                onPress={pickImage}
                style={({ pressed }) => [
                  styles.uploadButton,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="image-outline" size={20} color={colors.primary} />
                <Text style={[styles.uploadText, { color: themeColors.textPrimary }]}>
                  Fotoğraf Ekle
                </Text>
              </Pressable>
            </View>

            {pickedFile ? (
              <>
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  {pickedFile.type === 'image' ? (
                    <Image source={{ uri: pickedFile.uri }} style={styles.thumbnail} />
                  ) : (
                    <View style={styles.pdfIcon}>
                      <Ionicons name="document-text" size={28} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.previewTextWrap}>
                    <Text
                      style={[styles.previewName, { color: themeColors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {pickedFile.name}
                    </Text>
                    <Text
                      style={[
                        styles.previewType,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {pickedFile.type === 'image' ? 'Fotoğraf' : 'PDF'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  disabled={ocrLoading}
                  onPress={applyOcr}
                  style={({ pressed }) => [
                    styles.ocrButton,
                    pressed && styles.pressed,
                    ocrLoading && styles.ocrButtonDisabled,
                  ]}
                >
                  {ocrLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.ocrButtonText}>
                    {ocrLoading ? 'Metin okunuyor...' : 'OCR Uygula'}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              disabled={!canSave}
              onPress={saveNote}
              style={({ pressed }) => [
                styles.saveButton,
                !canSave && styles.saveButtonDisabled,
                pressed && canSave && styles.pressed,
              ]}
            >
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  contentInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  footer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  formContent: {
    padding: 20,
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
  keyboardView: {
    flex: 1,
  },
  ocrButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 50,
    width: '100%',
  },
  ocrButtonDisabled: {
    opacity: 0.65,
  },
  ocrButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginLeft: 8,
  },
  pdfIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  pressed: {
    opacity: 0.72,
  },
  previewCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
  },
  previewName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  previewTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  previewType: {
    fontSize: typography.sizes.sm,
    marginTop: 3,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 54,
    width: '100%',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  thumbnail: {
    borderRadius: 10,
    height: 52,
    width: 52,
  },
  uploadButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 10,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  uploadText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginLeft: 6,
  },
});
