import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';

import CalendarScreen from '../screens/CalendarScreen';
import ChatScreen from '../screens/ChatScreen';
import HomeScreen from '../screens/HomeScreen';
import SplashScreen from '../screens/onboarding/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import NotesScreen from '../screens/NotesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FlashcardReviewScreen from '../screens/FlashcardReviewScreen';
import QuizScreen from '../screens/QuizScreen';
import StudyScreen from '../screens/StudyScreen';
import { colors, getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ONBOARDING_DONE_KEY = 'onboarding_done';

const tabIcons = {
  Home: {
    active: 'home',
    inactive: 'home-outline',
  },
  Notes: {
    active: 'document-text',
    inactive: 'document-text-outline',
  },
  Study: {
    active: 'school',
    inactive: 'school-outline',
  },
  Profile: {
    active: 'person',
    inactive: 'person-outline',
  },
};

function MainTabs() {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTitleStyle: {
          color: themeColors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.bold,
        },
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconName = focused
            ? tabIcons[route.name].active
            : tabIcons[route.name].inactive;

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkOnboardingStatus() {
      try {
        const onboardingDone = await SecureStore.getItemAsync(
          ONBOARDING_DONE_KEY
        );

        if (isMounted) {
          setHasCompletedOnboarding(onboardingDone === 'true');
        }
      } finally {
        if (isMounted) {
          setIsCheckingOnboarding(false);
        }
      }
    }

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  async function completeOnboarding() {
    await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, 'true');
    setHasCompletedOnboarding(true);
  }

  if (isCheckingOnboarding) {
    return (
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
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {hasCompletedOnboarding ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen
            name="FlashcardReview"
            component={FlashcardReviewScreen}
          />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="ProfileSetup">
            {(props) => (
              <ProfileSetupScreen
                {...props}
                onOnboardingComplete={completeOnboarding}
              />
            )}
          </Stack.Screen>
        </>
      )}
    </Stack.Navigator>
  );
}
