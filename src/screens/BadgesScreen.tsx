import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { BADGES } from '../logic/badges';
import { useBadgeStore } from '../store/badgeStore';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Badges'>;

export function BadgesScreen({ navigation }: Props) {
  const awarded = useBadgeStore(s => s.awarded);
  const hydrate = useBadgeStore(s => s.hydrate);
  const evaluate = useBadgeStore(s => s.evaluate);

  useEffect(() => {
    hydrate().then(() => evaluate());
  }, [hydrate, evaluate]);

  const earnedCount = BADGES.filter(b => awarded.has(b.slug)).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Badges</Text>
          <Text style={styles.counter}>{earnedCount} / {BADGES.length}</Text>
        </View>

        <Text style={styles.eyebrow}>Milestones</Text>

        <View style={styles.grid}>
          {BADGES.map(b => {
            const unlocked = awarded.has(b.slug);
            return (
              <View
                key={b.slug}
                style={[styles.tile, unlocked ? styles.tileOn : styles.tileOff]}
              >
                <Text style={[styles.glyph, !unlocked && styles.glyphLocked]}>
                  {unlocked ? b.glyph : '🔒'}
                </Text>
                <Text style={[styles.label, !unlocked && styles.labelLocked]}>
                  {b.label}
                </Text>
                <Text style={[styles.hint, !unlocked && styles.hintLocked]}>
                  {b.hint}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  back: { ...Typography.body, color: Colors.textMuted },
  title: { ...Typography.h1, color: Colors.text },
  counter: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },

  eyebrow: { ...Typography.micro, color: Colors.textMuted, marginBottom: Spacing.md },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: '48%',
    minHeight: 140,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  tileOn: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  tileOff: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  glyph: { fontSize: 36 },
  glyphLocked: { opacity: 0.4 },
  label: { ...Typography.h2, color: Colors.text },
  labelLocked: { color: Colors.textMuted },
  hint: { ...Typography.caption, color: Colors.textMuted },
  hintLocked: { color: Colors.textDim },
});
