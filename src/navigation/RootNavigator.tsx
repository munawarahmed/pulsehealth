import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { useUserStore } from '../store/userStore';
import { useStreakStore } from '../store/streakStore';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MuscleGroupsScreen } from '../screens/MuscleGroupsScreen';
import { ExerciseListScreen } from '../screens/ExerciseListScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { MealCatalogScreen } from '../screens/MealCatalogScreen';
import { LogMealScreen } from '../screens/LogMealScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BadgesScreen } from '../screens/BadgesScreen';
import { QuickLogScreen } from '../screens/QuickLogScreen';
import { useBadgeStore } from '../store/badgeStore';
import { useSettingsStore } from '../store/settingsStore';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bg,
    card: Colors.bg,
    text: Colors.text,
    primary: Colors.primary,
    border: Colors.border,
  },
};

export function RootNavigator() {
  const hydrated = useUserStore(s => s.hydrated);
  const user = useUserStore(s => s.user);
  const hydrate = useUserStore(s => s.hydrate);
  const hydrateStreak = useStreakStore(s => s.hydrate);
  const hydrateBadges = useBadgeStore(s => s.hydrate);
  const hydrateSettings = useSettingsStore(s => s.hydrate);

  useEffect(() => {
    // All stores read independently from SQLite; running in parallel is fine.
    hydrate();
    hydrateStreak();
    hydrateBadges();
    hydrateSettings();
  }, [hydrate, hydrateStreak, hydrateBadges, hydrateSettings]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NavTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="MuscleGroups" component={MuscleGroupsScreen} />
            <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="MealCatalog" component={MealCatalogScreen} />
            <Stack.Screen name="LogMeal" component={LogMealScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Badges" component={BadgesScreen} />
            <Stack.Screen name="QuickLog" component={QuickLogScreen} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
