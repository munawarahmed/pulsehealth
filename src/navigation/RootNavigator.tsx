import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ScrollView } from 'react-native';
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

  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    // All stores read independently from SQLite; running in parallel is fine.
    // We catch errors so a broken hydrate (e.g. sql.js init failure on web)
    // surfaces to the user instead of leaving the splash spinner forever.
    const timer = setTimeout(() => setSlowLoad(true), 4000);
    Promise.all([
      hydrate(),
      hydrateStreak(),
      hydrateBadges(),
      hydrateSettings(),
    ])
      .catch((e: any) => {
        const msg = e?.message ? `${e.message}\n\n${e.stack ?? ''}` : String(e);
        setHydrationError(msg);
        // eslint-disable-next-line no-console
        console.error('[hydrate] failed', e);
      })
      .finally(() => clearTimeout(timer));
    return () => clearTimeout(timer);
  }, [hydrate, hydrateStreak, hydrateBadges, hydrateSettings]);

  if (hydrationError) {
    return (
      <ScrollView contentContainerStyle={styles.errorWrap}>
        <Text style={styles.errorTitle}>Couldn't initialize the database</Text>
        <Text style={styles.errorBody}>{hydrationError}</Text>
        <Text style={styles.errorHint}>
          Open DevTools → Console for the full stack. On web this is usually
          a sql.js / WASM loading issue.
        </Text>
      </ScrollView>
    );
  }

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
        {slowLoad && (
          <Text style={styles.loadingHint}>
            Loading SQLite (sql.js WASM) — first load can take a few seconds…
          </Text>
        )}
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
    padding: 24,
  },
  loadingHint: {
    color: Colors.textMuted,
    marginTop: 16,
    fontSize: 13,
    textAlign: 'center',
  },
  errorWrap: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    padding: 24,
    paddingTop: 80,
  },
  errorTitle: {
    color: Colors.danger,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorBody: {
    color: Colors.text,
    fontFamily: 'Menlo, monospace',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorHint: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
