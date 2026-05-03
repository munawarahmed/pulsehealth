import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { FoodRow } from '../components/FoodRow';
import { useNutritionStore } from '../store/nutritionStore';
import { useUserStore } from '../store/userStore';
import { preferredFlagsFor, rankByPreference } from '../logic/healthFilter';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MealCatalog'>;

export function MealCatalogScreen({ navigation }: Props) {
  const catalog = useNutritionStore(s => s.catalog);
  const catalogLoaded = useNutritionStore(s => s.catalogLoaded);
  const loadCatalog = useNutritionStore(s => s.loadCatalog);
  const conditions = useUserStore(s => s.user?.healthConditions ?? []);

  const [query, setQuery] = useState('');
  const [forYouOn, setForYouOn] = useState(true);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const preferred = useMemo(() => preferredFlagsFor(conditions), [conditions]);
  const hasPreferences = preferred.length > 0;

  const list = useMemo(() => {
    let out = catalog;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(f =>
        f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
      );
    }
    if (forYouOn && hasPreferences) {
      out = rankByPreference(out, preferred);
    }
    return out;
  }, [catalog, query, forYouOn, hasPreferences, preferred]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Meals</Text>
        <Pressable
          onPress={() => navigation.navigate('QuickLog')}
          hitSlop={12}
        >
          <Text style={styles.headerCta}>✦ Describe</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods…"
          placeholderTextColor={Colors.textDim}
          style={styles.search}
          selectionColor={Colors.primary}
        />
        {hasPreferences && (
          <Pressable
            onPress={() => setForYouOn(v => !v)}
            style={[styles.chip, forYouOn && styles.chipOn]}
          >
            <Text style={[styles.chipText, forYouOn && styles.chipTextOn]}>
              For you
            </Text>
          </Pressable>
        )}
      </View>

      {hasPreferences && forYouOn && (
        <Text style={styles.hint}>
          Ranked for {conditions.join(', ')} · prefer {preferred.join(', ')}
        </Text>
      )}

      {!catalogLoaded ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const matched = forYouOn
              ? preferred.filter(f => item.healthFlags.includes(f))
              : [];
            return (
              <FoodRow
                name={item.name}
                category={item.category}
                proteinPer100g={item.proteinPer100g}
                carbsPer100g={item.carbsPer100g}
                fatPer100g={item.fatPer100g}
                typicalPortionG={item.typicalPortionG}
                healthFlags={item.healthFlags}
                matchedFlags={matched}
                onPress={() => navigation.navigate('LogMeal', { foodId: item.id })}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No matches.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: { ...Typography.body, color: Colors.textMuted },
  title: { ...Typography.h1, color: Colors.text },
  headerCta: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  search: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    ...Typography.body,
  },
  chip: {
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },
  chipTextOn: { color: Colors.bg },

  hint: {
    ...Typography.micro,
    color: Colors.textDim,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.lg, paddingTop: Spacing.md },
  empty: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
