import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { calculateBmi } from '../logic/bmi';
import { useUserStore } from '../store/userStore';
import { HealthCondition } from '../logic/healthFilter';

interface ConditionOption {
  slug: HealthCondition;
  label: string;
}

const CONDITION_OPTIONS: ConditionOption[] = [
  { slug: 'diabetes',         label: 'Diabetes' },
  { slug: 'hypertension',     label: 'Hypertension' },
  { slug: 'high_cholesterol', label: 'High Cholesterol' },
  { slug: 'pcos',             label: 'PCOS' },
];

interface FormState {
  name: string;
  age: string;
  weight: string;
  height: string;
}

interface FormErrors {
  name?: string;
  age?: string;
  weight?: string;
  height?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Required';

  const age = Number(form.age);
  if (!form.age) errors.age = 'Required';
  else if (!Number.isInteger(age) || age < 10 || age > 100) errors.age = '10–100';

  const w = Number(form.weight);
  if (!form.weight) errors.weight = 'Required';
  else if (!Number.isFinite(w) || w < 25 || w > 300) errors.weight = '25–300 kg';

  const h = Number(form.height);
  if (!form.height) errors.height = 'Required';
  else if (!Number.isFinite(h) || h < 100 || h > 250) errors.height = '100–250 cm';

  return errors;
}

export function OnboardingScreen() {
  const saveOnboarding = useUserStore(s => s.saveOnboarding);
  const [form, setForm] = useState<FormState>({ name: '', age: '', weight: '', height: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [conditions, setConditions] = useState<Set<HealthCondition>>(new Set());

  const toggleCondition = (slug: HealthCondition) => {
    setConditions(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  };

  // Live BMI preview as the user fills in weight + height — gives the
  // "immediate visual feedback on health baseline" the spec calls for.
  const livePreview = useMemo(() => {
    const w = Number(form.weight);
    const h = Number(form.height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0 || w <= 0) return null;
    try { return calculateBmi(w, h); } catch { return null; }
  }, [form.weight, form.height]);

  const update = (field: keyof FormState) => (text: string) => {
    setForm(prev => ({ ...prev, [field]: text }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const onSubmit = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await saveOnboarding({
        name: form.name.trim(),
        age: Number(form.age),
        weightKg: Number(form.weight),
        heightCm: Number(form.height),
        healthConditions: Array.from(conditions),
      });
      // RootNavigator switches to Dashboard automatically once `user` is set.
    } catch (e) {
      console.warn('Onboarding save failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>Welcome to PulseHealth</Text>
          <Text style={styles.title}>Let's set your baseline.</Text>
          <Text style={styles.subtitle}>
            Four numbers. One health profile. Your data stays on this device.
          </Text>

          <View style={styles.form}>
            <Input
              label="Name"
              value={form.name}
              onChangeText={update('name')}
              autoCapitalize="words"
              error={errors.name}
              placeholder="Your name"
            />
            <Input
              label="Age"
              value={form.age}
              onChangeText={update('age')}
              keyboardType="number-pad"
              suffix="years"
              error={errors.age}
              placeholder="—"
            />
            <Input
              label="Weight"
              value={form.weight}
              onChangeText={update('weight')}
              keyboardType="decimal-pad"
              suffix="kg"
              error={errors.weight}
              placeholder="—"
            />
            <Input
              label="Height"
              value={form.height}
              onChangeText={update('height')}
              keyboardType="decimal-pad"
              suffix="cm"
              error={errors.height}
              placeholder="—"
            />
          </View>

          <View style={styles.conditionsBlock}>
            <Text style={styles.conditionsLabel}>Health conditions (optional)</Text>
            <Text style={styles.conditionsHint}>
              We use these to rank meal suggestions — never to hide foods.
            </Text>
            <View style={styles.chipGrid}>
              {CONDITION_OPTIONS.map(opt => {
                const active = conditions.has(opt.slug);
                return (
                  <Pressable
                    key={opt.slug}
                    onPress={() => toggleCondition(opt.slug)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {livePreview && (
            <View style={styles.preview}>
              <Text style={styles.previewEyebrow}>Live BMI</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewBmi}>{livePreview.bmi.toFixed(1)}</Text>
                <Text style={styles.previewCategory}>{livePreview.label}</Text>
              </View>
              <Text style={styles.previewNote}>{livePreview.riskNote}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.cta}>
          <Button
            label="Begin"
            onPress={onSubmit}
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
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  eyebrow: {
    ...Typography.micro,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.display,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  form: { marginBottom: Spacing.lg },
  conditionsBlock: { marginBottom: Spacing.lg },
  conditionsLabel: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  conditionsHint: {
    ...Typography.caption,
    color: Colors.textDim,
    marginBottom: Spacing.sm,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: Colors.primary,
  },
  chipText: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  preview: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  previewEyebrow: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  previewBmi: {
    ...Typography.display,
    color: Colors.data,
  },
  previewCategory: {
    ...Typography.h2,
    color: Colors.text,
  },
  previewNote: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
