import { useColorScheme } from 'react-native';

import useNotesStore from '../store/useNotesStore';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useNotesStore((state) => state.themeMode);

  if (themeMode === 'system') {
    return systemScheme;
  }

  return themeMode;
}