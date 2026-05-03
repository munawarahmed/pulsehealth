import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Exercise, useWorkoutStore } from '../store/workoutStore';
import { getDb } from '../db/client';
import { useToast } from '../components/Toast';
import { useBadgeStore } from '../store/badgeStore';
import { findBadge } from '../logic/badges';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: Exercise['muscleGroup'];
  description: string;
  image_url: string | null;
  source: Exercise['source'];
}

interface FormState { sets: string; reps: string; weight: string; }

function validate(s: FormState) {
  const errors: Partial<FormState> = {};
  const sets = Number(s.sets);
  const reps = Number(s.reps);
  if (!s.sets || !Number.isInteger(sets) || sets < 1 || sets > 20) errors.sets = '1–20';
  if (!s.reps || !Number.isInteger(reps) || reps < 1 || reps > 200) errors.reps = '1–200';
  if (s.weight) {
    const w = Number(s.weight);
    if (!Number.isFinite(w) || w < 0 || w > 500) errors.weight = '0–500';
  }
  return errors;
}

export function ExerciseDetailScreen({ route, navigation }: Props) {
  const { exerciseId } = route.params;
  const logWorkout = useWorkoutStore(s => s.logWorkout);
  const toast = useToast();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState<FormState>({ sets: '3', reps: '10', weight: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await getDb();
      const row = await db.getFirstAsync<ExerciseRow>(
        'SELECT * FROM exercises WHERE id = ?;', [exerciseId]
      );
      if (cancelled || !row) return;
      setExercise({
        id: row.id,
        name: row.name,
        muscleGroup: row.muscle_group,
        description: row.description,
        imageUrl: row.image_url,
        source: row.source,
      });
    })();
    return () => { cancelled = true; };
  }, [exerciseId]);

  const update = (k: keyof FormState) => (v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const onLog = async () => {
    if (!exercise) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await logWorkout({
        exerciseId: exercise.id,
        muscleGroup: exercise.muscleGroup,
        sets: Number(form.sets),
        reps: Number(form.reps),
        weightKg: form.weight ? Number(form.weight) : null,
      });

      // Surface a badge unlock if one was awarded by the side-effect.
      const justAwardedSlug = useBadgeStore.getState().justAwarded;
      const badge = justAwardedSlug ? findBadge(justAwardedSlug) : undefined;
      useBadgeStore.getState().consumeJustAwarded();

      toast.show(
        badge ? `Badge unlocked · ${badge.glyph} ${badge.label}` : 'Workout logged',
        {
          hint: badge
            ? `${exercise.name} — ${form.sets}×${form.reps}${form.weight ? ` @ ${form.weight}kg` : ''}`
            : `${exercise.name} — ${form.sets}×${form.reps}${form.weight ? ` @ ${form.weight}kg` : ''}`,
          variant: badge ? 'info' : 'success',
        }
      );
      navigation.goBack();
    } catch (e) {
      toast.show('Could not save', { hint: String((e as Error).message ?? e), variant: 'warn' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <Text style={styles.eyebrow}>{exercise.muscleGroup.toUpperCase()}</Text>
          <Text style={styles.title}>{exercise.name}</Text>

          {exercise.imageUrl && (
            <Image
              source={{ uri: exercise.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.descCard}>
            <Text style={styles.descLabel}>Form cues</Text>
            <Text style={styles.desc}>{exercise.description}</Text>
          </View>

          <Text style={styles.sectionTitle}>Log this set</Text>
          <View style={styles.formRow}>
            <View style={styles.cell}>
              <Input
                label="Sets"
                value={form.sets}
                onChangeText={update('sets')}
                keyboardType="number-pad"
                error={errors.sets}
              />
            </View>
            <View style={styles.cell}>
              <Input
                label="Reps"
                value={form.reps}
                onChangeText={update('reps')}
                keyboardType="number-pad"
                error={errors.reps}
              />
            </View>
            <View style={styles.cell}>
              <Input
                label="Weight"
                value={form.weight}
                onChangeText={update('weight')}
                keyboardType="decimal-pad"
                suffix="kg"
                error={errors.weight}
                placeholder="—"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.cta}>
          <Button
            label="Log workout"
            onPress={onLog}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loading: { ...Typography.body, color: Colors.textMuted, padding: Spacing.lg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  back: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.md },
  eyebrow: { ...Typography.micro, color: Colors.primary, marginBottom: Spacing.sm },
  title: { ...Typography.display, color: Colors.text, marginBottom: Spacing.lg },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceAlt,
    marginBottom: Spacing.lg,
  },
  descCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  descLabel: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  desc: { ...Typography.body, color: Colors.text, lineHeight: 22 },
  sectionTitle: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  formRow: { flexDirection: 'row' },
  cell: { flex: 1, marginHorizontal: Spacing.xs },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
