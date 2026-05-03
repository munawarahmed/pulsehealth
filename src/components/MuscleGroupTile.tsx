import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

interface Props {
  label: string;
  glyph: string;       // emoji or single character; replace with icons later
  onPress: () => void;
}

export function MuscleGroupTile({ label, glyph, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Text style={styles.glyph}>{glyph}</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7, borderColor: Colors.primary },
  glyph: { fontSize: 36 },
  label: { ...Typography.h2, color: Colors.text },
  accent: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    opacity: 0.06,
  },
});
