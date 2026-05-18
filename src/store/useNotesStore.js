import { create } from 'zustand';

export const useNotesStore = create((set) => ({
  notes: [],
  profile: { name: '', university: '', department: '' },
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
  setProfile: (profile) => set({ profile }),
  clearNotes: () => set({ notes: [] }),
}));
