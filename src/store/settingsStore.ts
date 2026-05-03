import { create } from 'zustand';
import { getDb } from '../db/client';
import {
  cancelScheduled, ensurePermission, NotificationsAvailable, scheduleDailyReminder,
} from '../services/notifications';

export interface AppSettings {
  gymReminderEnabled: boolean;
  gymReminderHour: number;     // 0–23
  gymReminderMinute: number;   // 0–59
  gymReminderNotifId: string | null;
}

interface SettingsState extends AppSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setGymReminder: (enabled: boolean, hour: number, minute: number) => Promise<{
    ok: boolean;
    reason?: 'unsupported' | 'permission_denied';
  }>;
}

interface SettingsRow {
  gym_reminder_enabled: number;
  gym_reminder_hour: number;
  gym_reminder_minute: number;
  gym_reminder_notif_id: string | null;
}

async function ensureRow(): Promise<SettingsRow> {
  const db = await getDb();
  const existing = await db.getFirstAsync<SettingsRow>(
    `SELECT gym_reminder_enabled, gym_reminder_hour, gym_reminder_minute,
            gym_reminder_notif_id
       FROM app_settings WHERE id = 1;`
  );
  if (existing) return existing;
  await db.runAsync(
    `INSERT INTO app_settings
       (id, gym_reminder_enabled, gym_reminder_hour, gym_reminder_minute, gym_reminder_notif_id)
     VALUES (1, 0, 18, 0, NULL);`
  );
  return {
    gym_reminder_enabled: 0,
    gym_reminder_hour: 18,
    gym_reminder_minute: 0,
    gym_reminder_notif_id: null,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  gymReminderEnabled: false,
  gymReminderHour: 18,
  gymReminderMinute: 0,
  gymReminderNotifId: null,
  hydrated: false,

  hydrate: async () => {
    const r = await ensureRow();
    set({
      gymReminderEnabled: r.gym_reminder_enabled === 1,
      gymReminderHour: r.gym_reminder_hour,
      gymReminderMinute: r.gym_reminder_minute,
      gymReminderNotifId: r.gym_reminder_notif_id,
      hydrated: true,
    });
  },

  setGymReminder: async (enabled, hour, minute) => {
    const db = await getDb();
    const prevId = get().gymReminderNotifId;

    // Always cancel any prior schedule so we don't leak duplicates.
    if (prevId) {
      await cancelScheduled(prevId);
    }

    let nextId: string | null = null;
    if (enabled) {
      if (!NotificationsAvailable) {
        // On web/test we can't schedule — persist the *intent* but report it
        // so the UI can disable the toggle gracefully.
        await db.runAsync(
          `UPDATE app_settings
             SET gym_reminder_enabled = 0,
                 gym_reminder_hour = ?, gym_reminder_minute = ?,
                 gym_reminder_notif_id = NULL
           WHERE id = 1;`,
          [hour, minute]
        );
        set({
          gymReminderEnabled: false,
          gymReminderHour: hour,
          gymReminderMinute: minute,
          gymReminderNotifId: null,
        });
        return { ok: false, reason: 'unsupported' };
      }
      const granted = await ensurePermission();
      if (!granted) {
        await db.runAsync(
          `UPDATE app_settings SET gym_reminder_enabled = 0, gym_reminder_notif_id = NULL WHERE id = 1;`
        );
        set({ gymReminderEnabled: false, gymReminderNotifId: null });
        return { ok: false, reason: 'permission_denied' };
      }
      nextId = await scheduleDailyReminder(hour, minute);
    }

    await db.runAsync(
      `UPDATE app_settings
         SET gym_reminder_enabled = ?, gym_reminder_hour = ?, gym_reminder_minute = ?,
             gym_reminder_notif_id = ?
       WHERE id = 1;`,
      [enabled ? 1 : 0, hour, minute, nextId]
    );
    set({
      gymReminderEnabled: enabled,
      gymReminderHour: hour,
      gymReminderMinute: minute,
      gymReminderNotifId: nextId,
    });
    return { ok: true };
  },
}));
