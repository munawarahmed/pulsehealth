import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

interface Props {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color?: string;
}

/**
 * Linear macro progress bar. Sprint 1 ships this as a visual placeholder for
 * the dashboard HUD; Sprint 3 will feed it real meal log totals.
 */
export function MacroBar({ label, current, goal, unit = 'g', color = Colors.primary }: Props) {
  const pct = goal > 0 ? Math.min(1, current / goal) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(current)}<Text style={styles.goal}> / {goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  label: { ...Typography.caption, color: Colors.textMuted },
  value: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  goal: { color: Colors.textDim, fontWeight: '400' },
  track: {
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radius.pill },
});
