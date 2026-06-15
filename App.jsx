import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppTheme } from './src/hooks/useAppTheme';
import AppNavigator from './src/navigation/AppNavigator';
import useNotesStore from './src/store/useNotesStore';
import { colors, getThemeColors } from './src/theme/colors';

export default function App() {
  const colorScheme = useAppTheme();
  const themeColors = getThemeColors(colorScheme);
  const [hasHydrated, setHasHydrated] = useState(
    useNotesStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsubscribe = useNotesStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    setHasHydrated(useNotesStore.persist.hasHydrated());

    return unsubscribe;
  }, []);

  const baseNavigationTheme =
    colorScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: colors.primary,
      background: themeColors.background,
      card: themeColors.surface,
      text: themeColors.textPrimary,
      border: themeColors.border,
      notification: colors.primary,
    },
  };

  if (!hasHydrated) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: themeColors.background,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
