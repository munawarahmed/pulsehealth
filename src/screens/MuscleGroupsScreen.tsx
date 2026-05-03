import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography } from '../theme/colors';
import { MUSCLE_GROUPS, MuscleGroupSlug } from '../logic/muscleGroups';
import { MuscleGroupTile } from '../components/MuscleGroupTile';
import { RootStackParamList } from '../navigation/types';

const GLYPHS: Record<MuscleGroupSlug, string> = {
  chest:     '🫀',
  back:      '🔱',
  shoulders: '🪨',
  biceps:    '💪',
  triceps:   '🦾',
  legs:      '🦵',
  cardio:    '❤️‍🔥',
};

type Props = NativeStackScreenProps<RootStackParamList, 'MuscleGroups'>;

export function MuscleGroupsScreen({ navigation }: Props) {
  // Pair tiles up so the grid stays balanced even with 7 entries (cardio
  // takes the last row alone).
  const rows: MuscleGroupSlug[][] = [];
  for (let i = 0; i < MUSCLE_GROUPS.length; i += 2) {
    const slugs = MUSCLE_GROUPS.slice(i, i + 2).map(g => g.slug);
    rows.push(slugs);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Workout</Text>
        <Text style={styles.title}>Pick a muscle group</Text>
        <Text style={styles.subtitle}>
          Seeded library is fully offline. Pull network exercises on demand.
        </Text>

        <View style={styles.grid}>
          {rows.map((slugs, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {slugs.map(slug => {
                const group = MUSCLE_GROUPS.find(g => g.slug === slug)!;
                return (
                  <View key={slug} style={styles.cell}>
                    <MuscleGroupTile
                      label={group.label}
                      glyph={GLYPHS[slug]}
                      onPress={() => navigation.navigate('ExerciseList', { slug })}
                    />
                  </View>
                );
              })}
              {slugs.length === 1 && <View style={styles.cell} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  eyebrow: { ...Typography.micro, color: Colors.primary, marginBottom: Spacing.sm },
  title: { ...Typography.display, color: Colors.text, marginBottom: Spacing.sm },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  grid: {},
  row: { flexDirection: 'row', marginBottom: Spacing.md },
  cell: { flex: 1, marginHorizontal: Spacing.xs },
});
