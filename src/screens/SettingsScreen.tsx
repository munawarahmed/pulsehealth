import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Input } from '../components/Input';
import { useSettingsStore } from '../store/settingsStore';
import { NotificationsAvailable } from '../services/notifications';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function SettingsScreen({ navigation }: Props) {
  const enabled = useSettingsStore(s => s.gymReminderEnabled);
  const hour = useSettingsStore(s => s.gymReminderHour);
  const minute = useSettingsStore(s => s.gymReminderMinute);
  const hydrate = useSettingsStore(s => s.hydrate);
  const setGymReminder = useSettingsStore(s => s.setGymReminder);

  const [hourStr, setHourStr] = useState(pad(hour));
  const [minuteStr, setMinuteStr] = useState(pad(minute));

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { setHourStr(pad(hour)); setMinuteStr(pad(minute)); }, [hour, minute]);

  const onToggle = async (next: boolean) => {
    const h = Math.max(0, Math.min(23, Number(hourStr) || hour));
    const m = Math.max(0, Math.min(59, Number(minuteStr) || minute));
    const result = await setGymReminder(next, h, m);
    if (!result.ok) {
      const msg = result.reason === 'unsupported'
        ? 'Notifications are unavailable on this platform. The reminder time is saved for native devices.'
        : 'Notification permission was denied. Enable it in system settings.';
      Alert.alert('Cannot enable reminder', msg);
    }
  };

  const onSaveTime = async () => {
    const h = Math.max(0, Math.min(23, Number(hourStr) || hour));
    const m = Math.max(0, Math.min(59, Number(minuteStr) || minute));
    await setGymReminder(enabled, h, m);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Daily gym reminder</Text>
              <Text style={styles.hint}>
                Local notification — never sent over the network.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={onToggle}
              trackColor={{ false: Colors.surfaceAlt, true: Colors.primary }}
              thumbColor={enabled ? Colors.bg : Colors.textDim}
            />
          </View>

          {!NotificationsAvailable && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Notifications aren't supported on {Platform.OS}. Build the app on iOS or Android to receive reminders.
              </Text>
            </View>
          )}

          <View style={styles.timeRow}>
            <View style={styles.timeCell}>
              <Input
                label="Hour"
                value={hourStr}
                onChangeText={setHourStr}
                onBlur={onSaveTime}
                keyboardType="number-pad"
                suffix="0–23"
                placeholder="18"
              />
            </View>
            <View style={styles.timeCell}>
              <Input
                label="Minute"
                value={minuteStr}
                onChangeText={setMinuteStr}
                onBlur={onSaveTime}
                keyboardType="number-pad"
                suffix="0–59"
                placeholder="00"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          onPress={() => navigation.navigate('Badges')}
        >
          <Text style={styles.linkLabel}>Milestone badges</Text>
          <Text style={styles.linkArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  back: { ...Typography.body, color: Colors.textMuted },
  title: { ...Typography.h1, color: Colors.text },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  label: { ...Typography.h2, color: Colors.text },
  hint: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  banner: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bannerText: { ...Typography.caption, color: Colors.warn },

  timeRow: { flexDirection: 'row', gap: Spacing.sm },
  timeCell: { flex: 1 },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  linkPressed: { borderColor: Colors.primary, opacity: 0.85 },
  linkLabel: { ...Typography.h2, color: Colors.text },
  linkArrow: { ...Typography.h1, color: Colors.textMuted },
});
