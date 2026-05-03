import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { useNutritionStore, FoodItem } from '../store/nutritionStore';
import { useUserStore } from '../store/userStore';
import { interpretMeal, InterpretMealOutput } from '../services/llmMiddleware';
import { kcalOf, macrosForPortion } from '../logic/macros';
import { HealthCondition } from '../logic/healthFilter';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuickLog'>;

interface ParsedRow {
  food: FoodItem | null;        // catalog match (null = no match)
  rawName: string;
  portionG: number;
  confidence: number;
}

export function QuickLogScreen({ navigation }: Props) {
  const catalog = useNutritionStore(s => s.catalog);
  const loadCatalog = useNutritionStore(s => s.loadCatalog);
  const findFoodByName = useNutritionStore(s => s.findFoodByName);
  const logMeal = useNutritionStore(s => s.logMeal);
  const conditions = useUserStore(s => s.user?.healthConditions ?? []);
  const toast = useToast();

  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [stats, setStats] = useState<{ promptBytes: number; cached: boolean } | null>(null);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const onParse = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setParsing(true);
    setParsed(null);
    try {
      const result = await interpretMeal({
        description: trimmed,
        conditions: conditions as HealthCondition[],
      });
      const rows = mapItemsToCatalog(result.output, findFoodByName);
      setParsed(rows);
      setStats(result.stats);
    } catch (e) {
      toast.show('Could not parse', { hint: String((e as Error).message ?? e), variant: 'warn' });
    } finally {
      setParsing(false);
    }
  };

  const onLogAll = async () => {
    if (!parsed) return;
    const matched = parsed.filter(r => r.food);
    if (matched.length === 0) {
      toast.show('Nothing matched', { hint: 'No catalog matches found.', variant: 'warn' });
      return;
    }
    setLogging(true);
    try {
      // Sequential — keeps the ON CONFLICT ordering deterministic and lets
      // the badge evaluator see each insert.
      for (const r of matched) {
        await logMeal(r.food!, r.portionG);
      }
      toast.show(
        matched.length === 1 ? 'Meal logged' : `${matched.length} meals logged`,
        { hint: matched.map(r => r.food!.name).join(' · '), variant: 'success' }
      );
      navigation.goBack();
    } catch (e) {
      toast.show('Could not save', { hint: String((e as Error).message ?? e), variant: 'warn' });
    } finally {
      setLogging(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Text style={styles.back}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Quick Log</Text>
            <View style={{ width: 50 }} />
          </View>

          <Text style={styles.eyebrow}>Describe what you ate</Text>
          <Text style={styles.subtitle}>
            Free text. The middleware sends only your description and conditions —
            never your name or profile.
          </Text>

          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={3}
            placeholder="e.g. 2 rotis with daal masoor and a small bowl of yogurt"
            placeholderTextColor={Colors.textDim}
            style={styles.textArea}
            selectionColor={Colors.primary}
          />

          <View style={styles.parseRow}>
            <Button label={parsing ? 'Parsing…' : 'Parse'} onPress={onParse} disabled={parsing || !text.trim()} loading={parsing} />
          </View>

          {stats && (
            <Text style={styles.stats}>
              {stats.cached
                ? '⚡ Returned from session memo (0 bytes sent)'
                : `📤 ${stats.promptBytes} bytes sent (system + pruned input)`}
            </Text>
          )}

          {parsed && parsed.length === 0 && (
            <Text style={styles.empty}>
              No items matched. Try mentioning roti, naan, daal, biryani, karahi, etc.
            </Text>
          )}

          {parsed && parsed.length > 0 && (
            <View style={styles.results}>
              <Text style={styles.sectionTitle}>
                Matched {parsed.filter(r => r.food).length} of {parsed.length}
              </Text>
              {parsed.map((r, idx) => (
                <ParsedRowCard key={`${r.rawName}-${idx}`} row={r} />
              ))}
            </View>
          )}
        </ScrollView>

        {parsed && parsed.some(r => r.food) && (
          <View style={styles.cta}>
            <Button
              label={`Log ${parsed.filter(r => r.food).length} item${parsed.filter(r => r.food).length === 1 ? '' : 's'}`}
              onPress={onLogAll}
              loading={logging}
              disabled={logging}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function mapItemsToCatalog(
  output: InterpretMealOutput,
  finder: (name: string) => FoodItem | null
): ParsedRow[] {
  return output.items.map(item => ({
    food: finder(item.name),
    rawName: item.name,
    portionG: item.portionG,
    confidence: item.confidence,
  }));
}

function ParsedRowCard({ row }: { row: ParsedRow }) {
  const matched = !!row.food;
  if (!matched) {
    return (
      <View style={[styles.card, styles.cardMiss]}>
        <Text style={styles.cardName}>{row.rawName}</Text>
        <Text style={styles.cardMissNote}>No catalog match</Text>
      </View>
    );
  }
  const food = row.food!;
  const macros = macrosForPortion(food, row.portionG);
  const kcal = kcalOf(macros);
  return (
    <View style={[styles.card, styles.cardHit]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardName} numberOfLines={1}>{food.name}</Text>
        <Text style={styles.cardKcal}>{kcal} kcal</Text>
      </View>
      <Text style={styles.cardMeta}>{row.portionG}g · P {macros.proteinG}g · C {macros.carbsG}g · F {macros.fatG}g</Text>
      <View style={styles.confRow}>
        <View style={styles.confBar}>
          <View style={[styles.confFill, { width: `${Math.round(row.confidence * 100)}%` }]} />
        </View>
        <Text style={styles.confText}>{Math.round(row.confidence * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  back: { ...Typography.body, color: Colors.textMuted },
  title: { ...Typography.h1, color: Colors.text },

  eyebrow: { ...Typography.micro, color: Colors.primary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg, lineHeight: 22 },

  textArea: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  parseRow: { marginBottom: Spacing.md },

  stats: {
    ...Typography.micro,
    color: Colors.data,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  empty: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  results: { marginTop: Spacing.md },
  sectionTitle: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHit: { borderColor: Colors.primary },
  cardMiss: { borderColor: Colors.border, opacity: 0.6 },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  cardName: { ...Typography.h2, color: Colors.text, flex: 1 },
  cardKcal: { ...Typography.body, color: Colors.data, fontWeight: '700', marginLeft: Spacing.sm },
  cardMeta: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  cardMissNote: { ...Typography.caption, color: Colors.warn },

  confRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  confBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  confFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.pill },
  confText: { ...Typography.micro, color: Colors.textDim, minWidth: 36, textAlign: 'right' },

  cta: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
