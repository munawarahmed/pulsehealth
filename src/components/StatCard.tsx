import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: 'primary' | 'data' | 'neutral';
}

export function StatCard({ label, value, hint, accent = 'data' }: Props) {
  const valueColor =
    accent === 'primary' ? Colors.primary :
    accent === 'data' ? Colors.data : Colors.text;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flex: 1,
  },
  label: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  value: {
    ...Typography.display,
    fontSize: 32,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
