import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { StatCard } from '../components/StatCard';
import { MacroBar } from '../components/MacroBar';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { useStreakStore } from '../store/streakStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useBadgeStore } from '../store/badgeStore';
import { BADGES } from '../logic/badges';
import { dailyGoalsFor, kcalOf } from '../logic/macros';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const user = useUserStore(s => s.user);
  const bmi = useUserStore(s => s.bmi);
  const streakCurrent = useStreakStore(s => s.current);
  const streakLongest = useStreakStore(s => s.longest);
  const isStale = useStreakStore(s => s.isStale);
  const hydrateStreak = useStreakStore(s => s.hydrate);
  const countLogsForDay = useWorkoutStore(s => s.countLogsForDay);
  const todayTotals = useNutritionStore(s => s.todayTotals);
  const refreshToday = useNutritionStore(s => s.refreshToday);
  const awardedBadges = useBadgeStore(s => s.awarded);
  const hydrateBadges = useBadgeStore(s => s.hydrate);

  const [todayLogs, setTodayLogs] = useState(0);

  // Re-pull streak, workout count, and meal totals whenever the dashboard
  // regains focus (e.g. after a workout or meal was logged on a child screen).
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        await Promise.all([hydrateStreak(), refreshToday(), hydrateBadges()]);
        const n = await countLogsForDay();
        if (!cancelled) setTodayLogs(n);
      })();
      return () => { cancelled = true; };
    }, [hydrateStreak, countLogsForDay, refreshToday, hydrateBadges])
  );

  if (!user || !bmi) return null;

  const stale = isStale();
  const todaysFocus = todayLogs > 0
    ? `${todayLogs} exercise${todayLogs === 1 ? '' : 's'} logged`
    : 'Plan your session';

  const goals = dailyGoalsFor(user.weightKg);
  const macros = {
    protein: { current: todayTotals.proteinG, goal: goals.proteinG },
    carbs:   { current: todayTotals.carbsG,   goal: goals.carbsG },
    fat:     { current: todayTotals.fatG,     goal: goals.fatG },
  };
  const kcalToday = kcalOf(todayTotals);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {user.name.split(' ')[0]}</Text>
            <Text style={styles.subgreeting}>Single-glance HUD · {todaysDate()}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            style={({ pressed }) => [styles.gear, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.gearGlyph}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.streak}>
          <Text style={styles.flame}>{stale ? '💤' : '🔥'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakLabel}>
              {stale ? 'Streak paused' : 'Current streak'}
            </Text>
            <Text style={[styles.streakValue, stale && styles.streakValueStale]}>
              {streakCurrent}<Text style={styles.streakUnit}> days</Text>
            </Text>
            {streakLongest > 0 && (
              <Text style={styles.streakLongest}>Longest · {streakLongest}</Text>
            )}
          </View>
          <View style={styles.focus}>
            <Text style={styles.focusLabel}>Today</Text>
            <Text style={styles.focusValue}>{todaysFocus}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="BMI"
            value={bmi.bmi.toFixed(1)}
            hint={bmi.label}
            accent="data"
          />
          <View style={{ width: Spacing.md }} />
          <StatCard
            label="Weight"
            value={`${user.weightKg}`}
            hint="kg"
            accent="primary"
          />
        </View>

        <View style={styles.ctaRow}>
          <View style={styles.ctaCell}>
            <Button
              label="Start workout"
              onPress={() => navigation.navigate('MuscleGroups')}
            />
          </View>
          <View style={styles.ctaCell}>
            <Button
              label="Log meal"
              variant="ghost"
              onPress={() => navigation.navigate('MealCatalog')}
            />
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Badges')}
          style={({ pressed }) => [styles.badgeStrip, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.badgeStripLeft}>
            <Text style={styles.badgeStripLabel}>Badges</Text>
            <Text style={styles.badgeStripValue}>
              {awardedBadges.size}<Text style={styles.badgeStripTotal}> / {BADGES.length}</Text>
            </Text>
          </View>
          <View style={styles.badgeStripRow}>
            {BADGES.slice(0, 6).map(b => (
              <Text
                key={b.slug}
                style={[styles.badgeGlyph, !awardedBadges.has(b.slug) && styles.badgeGlyphDim]}
              >
                {awardedBadges.has(b.slug) ? b.glyph : '·'}
              </Text>
            ))}
          </View>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.macroHeader}>
            <Text style={styles.sectionTitle}>Macro balance</Text>
            <Text style={styles.kcal}>
              {kcalToday}<Text style={styles.kcalGoal}> / {goals.kcal} kcal</Text>
            </Text>
          </View>
          <MacroBar label="Protein" current={macros.protein.current} goal={macros.protein.goal} color={Colors.primary} />
          <MacroBar label="Carbs"   current={macros.carbs.current}   goal={macros.carbs.goal}   color={Colors.data} />
          <MacroBar label="Fat"     current={macros.fat.current}     goal={macros.fat.goal}     color={Colors.warn} />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>{bmi.riskNote}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function todaysDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: { ...Typography.display, color: Colors.text },
  subgreeting: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },
  gear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearGlyph: { fontSize: 20, color: Colors.textMuted },

  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  flame: { fontSize: 32, marginRight: Spacing.md },
  streakLabel: { ...Typography.micro, color: Colors.textMuted },
  streakValue: { ...Typography.h1, color: Colors.primary, marginTop: 2 },
  streakValueStale: { color: Colors.textMuted },
  streakUnit: { ...Typography.body, color: Colors.textMuted, fontWeight: '400' },
  streakLongest: { ...Typography.caption, color: Colors.textDim, marginTop: 2 },
  focus: { alignItems: 'flex-end', maxWidth: 130 },
  focusLabel: { ...Typography.micro, color: Colors.textMuted },
  focusValue: { ...Typography.h2, color: Colors.text, marginTop: 2, textAlign: 'right' },

  statsRow: { flexDirection: 'row', marginBottom: Spacing.md },

  ctaRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  ctaCell: { flex: 1 },

  badgeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  badgeStripLeft: {},
  badgeStripLabel: { ...Typography.micro, color: Colors.textMuted },
  badgeStripValue: { ...Typography.h2, color: Colors.primary, marginTop: 2 },
  badgeStripTotal: { color: Colors.textMuted, fontWeight: '400' },
  badgeStripRow: { flexDirection: 'row', gap: 6 },
  badgeGlyph: { fontSize: 22 },
  badgeGlyphDim: { color: Colors.textDim, opacity: 0.4 },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  kcal: { ...Typography.body, color: Colors.text, fontWeight: '700' },
  kcalGoal: { color: Colors.textDim, fontWeight: '400' },

  note: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  noteText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
});
