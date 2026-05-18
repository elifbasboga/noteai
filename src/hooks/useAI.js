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

  const generateQuestions = (text, subject) =>
    runAction(() => ApiService.generateQuestions(text, subject));

  const generateFlashcards = (text, subject) =>
    runAction(() => ApiService.generateFlashcards(text, subject));

  return {
    loading,
    error,
    extractText,
    summarize,
    generateQuestions,
    generateFlashcards,
  };
}
