import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { FoodItem, useNutritionStore } from '../store/nutritionStore';
import { kcalOf, macrosForPortion } from '../logic/macros';
import { useToast } from '../components/Toast';
import { useBadgeStore } from '../store/badgeStore';
import { findBadge } from '../logic/badges';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LogMeal'>;

const PORTION_PRESETS = [0.5, 1.0, 1.5, 2.0];

export function LogMealScreen({ route, navigation }: Props) {
  const { foodId } = route.params;
  const getFood = useNutritionStore(s => s.getFood);
  const logMeal = useNutritionStore(s => s.logMeal);
  const toast = useToast();

  const [food, setFood] = useState<FoodItem | null>(null);
  const [portionStr, setPortionStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const f = await getFood(foodId);
      if (cancelled) return;
      setFood(f);
      if (f) setPortionStr(String(f.typicalPortionG));
    })();
    return () => { cancelled = true; };
  }, [foodId, getFood]);

  const portionG = Number(portionStr);
  const portionValid = Number.isFinite(portionG) && portionG > 0 && portionG <= 2000;

  const live = useMemo(() => {
    if (!food || !portionValid) return null;
    const macros = macrosForPortion(food, portionG);
    return { macros, kcal: kcalOf(macros) };
  }, [food, portionG, portionValid]);

  const onLog = async () => {
    if (!food || !portionValid) return;
    setSubmitting(true);
    try {
      await logMeal(food, portionG);

      const justAwardedSlug = useBadgeStore.getState().justAwarded;
      const badge = justAwardedSlug ? findBadge(justAwardedSlug) : undefined;
      useBadgeStore.getState().consumeJustAwarded();

      toast.show(
        badge ? `Badge unlocked · ${badge.glyph} ${badge.label}` : 'Meal logged',
        {
          hint: `${food.name} · ${portionG}g · ${live?.kcal ?? 0} kcal`,
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

  if (!food) {
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

          <Text style={styles.eyebrow}>{food.category.toUpperCase()}</Text>
          <Text style={styles.title}>{food.name}</Text>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Live preview</Text>
            <Text style={styles.previewKcal}>
              {live ? live.kcal : 0}<Text style={styles.previewKcalUnit}> kcal</Text>
            </Text>
            <View style={styles.macroRow}>
              <View style={styles.macroCell}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{live?.macros.proteinG ?? 0}g</Text>
              </View>
              <View style={styles.macroCell}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{live?.macros.carbsG ?? 0}g</Text>
              </View>
              <View style={styles.macroCell}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{live?.macros.fatG ?? 0}g</Text>
              </View>
            </View>
          </View>

          <Input
            label="Portion"
            value={portionStr}
            onChangeText={setPortionStr}
            keyboardType="decimal-pad"
            suffix="g"
            error={!portionValid && portionStr ? 'Enter 1–2000' : undefined}
          />

          <View style={styles.presetRow}>
            {PORTION_PRESETS.map(mult => {
              const grams = Math.round(food.typicalPortionG * mult);
              const isActive = portionG === grams;
              return (
                <Pressable
                  key={mult}
                  onPress={() => setPortionStr(String(grams))}
                  style={[styles.preset, isActive && styles.presetActive]}
                >
                  <Text style={[styles.presetMult, isActive && styles.presetTextActive]}>
                    ×{mult}
                  </Text>
                  <Text style={[styles.presetGrams, isActive && styles.presetTextActive]}>
                    {grams}g
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.footnote}>
            Typical portion · {food.typicalPortionG}g
          </Text>
        </ScrollView>

        <View style={styles.cta}>
          <Button
            label="Log meal"
            onPress={onLog}
            loading={submitting}
            disabled={submitting || !portionValid}
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

  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  previewKcal: {
    ...Typography.display,
    color: Colors.data,
    fontSize: 44,
    marginBottom: Spacing.md,
  },
  previewKcalUnit: { ...Typography.h2, color: Colors.textMuted, fontWeight: '400' },
  macroRow: { flexDirection: 'row', gap: Spacing.sm },
  macroCell: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  macroLabel: { ...Typography.micro, color: Colors.textMuted, marginBottom: 2 },
  macroValue: { ...Typography.h2, color: Colors.text },

  presetRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  preset: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  presetActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: Colors.primary,
  },
  presetMult: { ...Typography.caption, color: Colors.textMuted, fontWeight: '700' },
  presetGrams: { ...Typography.micro, color: Colors.textDim, marginTop: 2 },
  presetTextActive: { color: Colors.primary },

  footnote: { ...Typography.caption, color: Colors.textDim, marginTop: Spacing.xs },

  cta: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
