import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

const initialState = {
  notes: [],
  cardProgress: {},
  exams: [],
  profile: { name: '', university: '', department: '' },
  quizResults: [],
  themeMode: 'system',
};

const useNotesStore = create(
  persist(
    (set) => ({
      ...initialState,
      addNote: (note) =>
        set((state) => ({
          notes: [note, ...state.notes],
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates } : note
          ),
        })),
      removeNote: (noteId) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== noteId),
        })),
      updateCardProgress: (cardId, grade) =>
        set((state) => {
          const prev = state.cardProgress[cardId] || {
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
          };
          let { easeFactor, interval, repetitions } = prev;

          if (grade >= 3) {
            if (repetitions === 0) interval = 1;
            else if (repetitions === 1) interval = 6;
            else interval = Math.round(interval * easeFactor);
            repetitions += 1;
          } else {
            repetitions = 0;
            interval = 1;
          }

          easeFactor = Math.max(
            1.3,
            easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
          );

          const nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + interval);

          return {
            cardProgress: {
              ...state.cardProgress,
              [cardId]: {
                easeFactor,
                interval,
                repetitions,
                lastReviewed: new Date().toISOString(),
                nextReview: nextReview.toISOString(),
              },
            },
          };
        }),
      addExam: (exam) =>
        set((state) => ({
          exams: [exam, ...state.exams].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          ),
        })),
      updateExam: (id, updates) =>
        set((state) => ({
          exams: state.exams.map((exam) =>
            exam.id === id ? { ...exam, ...updates } : exam
          ),
        })),
      deleteExam: (id) =>
        set((state) => ({
          exams: state.exams.filter((exam) => exam.id !== id),
        })),
      addQuizResult: (result) =>
        set((state) => ({
          quizResults: [result, ...state.quizResults].slice(0, 50),
        })),
      clearQuizResults: () => set({ quizResults: [] }),
      setProfile: (profile) => set({ profile }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      clearNotes: () => set({ notes: [] }),
      resetStore: () => set(initialState),
    }),
    {
      name: 'noteai-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useNotesStore;
export { useNotesStore };
