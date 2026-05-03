import React from 'react';
import { Pressable, Text, View, StyleSheet, Image } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

interface Props {
  name: string;
  hint?: string;
  imageUrl?: string | null;
  source: 'seed' | 'wger' | 'exercisedb';
  onPress: () => void;
}

export function ExerciseRow({ name, hint, imageUrl, source, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbGlyph}>›</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {hint ? <Text style={styles.hint} numberOfLines={2}>{hint}</Text> : null}
      </View>
      {source !== 'seed' && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{source}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pressed: { opacity: 0.75, borderColor: Colors.primary },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  thumbGlyph: { color: Colors.textDim, fontSize: 24 },
  body: { flex: 1 },
  name: { ...Typography.h2, color: Colors.text, marginBottom: 2 },
  hint: { ...Typography.caption, color: Colors.textMuted },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    marginLeft: Spacing.sm,
  },
  badgeText: { ...Typography.micro, color: Colors.data },
});
