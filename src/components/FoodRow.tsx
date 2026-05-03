import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { kcalOf } from '../logic/macros';

interface Props {
  name: string;
  category: string;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  typicalPortionG: number;
  healthFlags: string[];
  matchedFlags?: string[];   // subset that satisfies user's preferred flags
  onPress: () => void;
}

const FLAG_LABELS: Record<string, string> = {
  low_sodium:   'Low Na',
  low_gi:       'Low GI',
  high_protein: 'High Protein',
  low_fat:      'Low Fat',
  high_fiber:   'High Fiber',
};

export function FoodRow({
  name, category, proteinPer100g, carbsPer100g, fatPer100g,
  typicalPortionG, healthFlags, matchedFlags = [], onPress,
}: Props) {
  // Show typical-portion macros so users see realistic numbers, not per-100g.
  const ratio = typicalPortionG / 100;
  const p = Math.round(proteinPer100g * ratio);
  const c = Math.round(carbsPer100g * ratio);
  const f = Math.round(fatPer100g * ratio);
  const kcal = kcalOf({ proteinG: p, carbsG: c, fatG: f });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {matchedFlags.length > 0 && (
            <View style={styles.forYou}>
              <Text style={styles.forYouText}>For you</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {category} · {typicalPortionG}g · {kcal} kcal
        </Text>
        <Text style={styles.macros}>
          P {p}g · C {c}g · F {f}g
        </Text>
        {healthFlags.length > 0 && (
          <View style={styles.flagRow}>
            {healthFlags.map(flag => {
              const matched = matchedFlags.includes(flag);
              return (
                <View
                  key={flag}
                  style={[styles.flag, matched && styles.flagMatched]}
                >
                  <Text style={[styles.flagText, matched && styles.flagTextMatched]}>
                    {FLAG_LABELS[flag] ?? flag}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pressed: { opacity: 0.75, borderColor: Colors.primary },
  body: { gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { ...Typography.h2, color: Colors.text, flex: 1 },
  forYou: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
  forYouText: { ...Typography.micro, color: Colors.bg, letterSpacing: 0.5 },
  meta: { ...Typography.caption, color: Colors.textMuted, textTransform: 'capitalize' },
  macros: { ...Typography.caption, color: Colors.data, fontWeight: '600' },
  flagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.xs,
  },
  flag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flagMatched: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: Colors.primary,
  },
  flagText: { ...Typography.micro, color: Colors.textDim, letterSpacing: 0.3 },
  flagTextMatched: { color: Colors.primary },
});
