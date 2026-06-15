import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAI } from '../hooks/useAI';
import { useNotesStore } from '../store/useNotesStore';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

function formatTime(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildNoteContext(note) {
  const summary = note.summary
    ? `\n\nÖzet:\n${note.summary.overview || ''}\n\nAnahtar kavramlar:\n${(
        note.summary.keyConcepts || []
      ).join(', ')}`
    : '';

  return `${note.content || ''}${summary}`.trim();
}

function TypingDots() {
  const dotOne = useRef(new Animated.Value(0.3)).current;
  const dotTwo = useRef(new Animated.Value(0.3)).current;
  const dotThree = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animations = [dotOne, dotTwo, dotThree].map((dot) =>
      Animated.sequence([
        Animated.timing(dot, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.3,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );
    const loop = Animated.loop(Animated.stagger(140, animations));

    loop.start();

    return () => loop.stop();
  }, [dotOne, dotTwo, dotThree]);

  return (
    <View style={styles.typingDots}>
      {[dotOne, dotTwo, dotThree].map((dot, index) => (
        <Animated.View key={index} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

export default function ChatScreen({ navigation, route }) {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const noteId = route.params?.noteId;
  const note = useNotesStore((state) =>
    state.notes.find((item) => item.id === noteId)
  );
  const { chat, loading, error } = useAI();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  const noteContext = useMemo(() => (note ? buildNoteContext(note) : ''), [note]);
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToOffset?.({ offset: 0 }));
    }
  }, [messages.length]);

  if (!note) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.centerState}>
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
            Not bulunamadı
          </Text>
          <Pressable style={styles.primaryButton} onPress={navigation.goBack}>
            <Text style={styles.primaryButtonText}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function sendMessage() {
    const trimmedInput = input.trim();

    if (!trimmedInput || loading || !noteContext) {
      return;
    }

    const userMessage = {
      id: `${Date.now()}_user`,
      role: 'user',
      content: trimmedInput,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');

    const response = await chat(
      nextMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      noteContext,
      note.subject || 'Genel'
    );

    if (response) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}_assistant`,
          role: 'assistant',
          content: response,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  function renderMessage({ item }) {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.assistantMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            {
              backgroundColor: isUser ? colors.primary : themeColors.surface,
              borderColor: isUser ? colors.primary : themeColors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#FFFFFF' : themeColors.textPrimary },
            ]}
          >
            {item.content}
          </Text>
        </View>
        <Text
          style={[
            styles.timestamp,
            {
              color: themeColors.textSecondary,
              textAlign: isUser ? 'right' : 'left',
            },
          ]}
        >
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <Pressable onPress={navigation.goBack} style={styles.headerIconButton}>
            <Ionicons
              name="chevron-back"
              size={26}
              color={themeColors.textPrimary}
            />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
              Not Asistanı
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}
            >
              {note.title}
            </Text>
          </View>
          <View style={styles.headerIconButton} />
        </View>

        {!noteContext ? (
          <View style={styles.centerState}>
            <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
              Önce not içeriği ekle
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={listRef}
              contentContainerStyle={styles.messageList}
              data={invertedMessages}
              inverted
              keyExtractor={(item) => item.id}
              ListFooterComponent={
                messages.length === 0 ? (
                  <Text
                    style={[
                      styles.emptyHint,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    Notun hakkında soru sorarak başlayabilirsin.
                  </Text>
                ) : null
              }
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
            />

            {loading ? (
              <View style={styles.typingRow}>
                <View
                  style={[
                    styles.typingBubble,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <TypingDots />
                </View>
              </View>
            ) : null}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <View style={[styles.inputWrap, { borderTopColor: themeColors.border }]}>
              <TextInput
                multiline
                onChangeText={setInput}
                placeholder="Bir şey sor..."
                placeholderTextColor={themeColors.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary,
                  },
                ]}
                value={input}
              />
              <Pressable
                disabled={!input.trim() || loading}
                onPress={sendMessage}
                style={({ pressed }) => [
                  styles.sendButton,
                  (!input.trim() || loading) && styles.disabledButton,
                  pressed && styles.pressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  assistantMessageRow: {
    alignItems: 'flex-start',
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
  disabledButton: {
    opacity: 0.5,
  },
  emptyHint: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
    maxWidth: '100%',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    fontSize: typography.sizes.md,
    maxHeight: 112,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  inputWrap: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  messageBubble: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '82%',
    padding: 12,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  messageRow: {
    marginBottom: 14,
  },
  messageText: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
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
    minHeight: 50,
    paddingHorizontal: 22,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  typingBubble: {
    borderBottomLeftRadius: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typingDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
  },
  typingRow: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  userMessageRow: {
    alignItems: 'flex-end',
  },
});
