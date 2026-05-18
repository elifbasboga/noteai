import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreateNoteModal from '../components/CreateNoteModal';
import { useNotesStore } from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const subjectColors = ['#7C3AED', '#0F6E56', '#854F0B', '#993556', '#185FA5'];

function formatCreatedDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function NotesScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const notes = useNotesStore((state) => state.notes);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  function confirmDelete(note) {
    Alert.alert('Notu sil', `"${note.title}" silinsin mi?`, [
      {
        text: 'Vazgeç',
        style: 'cancel',
      },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteNote(note.id),
      },
    ]);
  }

  function renderNoteCard({ item, index }) {
    const subject = item.subject || 'Genel';
    const pillColor = subjectColors[index % subjectColors.length];

    return (
      <Pressable
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        onLongPress={() => confirmDelete(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.subjectPill, { backgroundColor: pillColor }]}>
            <Text style={styles.subjectText} numberOfLines={1}>
              {subject}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
            {formatCreatedDate(item.createdAt)}
          </Text>
        </View>

        <Text
          style={[styles.noteTitle, { color: themeColors.textPrimary }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {item.content ? (
          <Text
            style={[styles.noteContent, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {item.content}
          </Text>
        ) : null}

        {item.fileUri ? (
          <View style={styles.fileRow}>
            <Ionicons
              name="attach-outline"
              size={16}
              color={themeColors.textSecondary}
            />
            <Text
              style={[styles.fileName, { color: themeColors.textSecondary }]}
              numberOfLines={1}
            >
              {item.fileName}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
          Notlarım
        </Text>
        <Pressable
          accessibilityLabel="Not ekle"
          onPress={() => setIsCreateModalVisible(true)}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={72}
            color={colors.primary}
          />
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
            Henüz not yok
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}
          >
            Sağ üstteki + ile ilk notunu ekle
          </Text>
        </View>
      ) : (
        <FlashList
          contentContainerStyle={styles.listContent}
          data={notes}
          estimatedItemSize={130}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CreateNoteModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  addButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  container: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: typography.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: 18,
  },
  fileName: {
    flex: 1,
    fontSize: typography.sizes.sm,
    marginLeft: 6,
  },
  fileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  noteContent: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  subjectPill: {
    borderRadius: 999,
    maxWidth: '60%',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
