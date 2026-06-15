import useNotesStore from '../store/useNotesStore';

export function useAppTheme() {
  const themeMode = useNotesStore((state) => state.themeMode);

  if (themeMode === 'dark') {
    return 'dark';
  }

  return 'light';
}