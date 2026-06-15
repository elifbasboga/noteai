import { useState } from 'react';

import { ApiService } from '../services/api';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runAction(action) {
    setLoading(true);
    setError(null);

    try {
      return await action();
    } catch (err) {
      const message = err.message || 'AI işlemi başarısız oldu.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const extractText = (fileUri, fileType) =>
    runAction(() => ApiService.extractText(fileUri, fileType));

  const summarize = (text, subject) =>
    runAction(() => ApiService.summarize(text, subject));

  const generateQuestions = (
    text,
    subject,
    questionType = 'mixed',
    language = 'tr'
  ) =>
    runAction(() =>
      ApiService.generateQuestions(text, subject, questionType, language)
    );

  const generateFlashcards = (text, subject) =>
    runAction(() => ApiService.generateFlashcards(text, subject));

  const chat = (messages, noteContent, subject) =>
    runAction(() => ApiService.chat(messages, noteContent, subject));

  return {
    loading,
    error,
    extractText,
    summarize,
    generateQuestions,
    generateFlashcards,
    chat,
  };
}
