/**
 * Local notifications wrapper.
 *
 * expo-notifications is a native-only module. On web — and during Jest
 * unit tests — every export here is a graceful no-op so the rest of the
 * app doesn't have to think about platforms. On iOS/Android we lazy-load
 * the real module so the web bundle never imports it.
 *
 * Only LOCAL notifications. We never send anything over the network.
 */

import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

interface NotificationsModule {
  // We type the bits we touch — we don't pull expo-notifications types into
  // the web bundle.
  setNotificationHandler: (h: any) => void;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getPermissionsAsync: () => Promise<{ status: string }>;
  scheduleNotificationAsync: (req: any) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  presentNotificationAsync?: (req: any) => Promise<string>;
  AndroidImportance?: any;
  SchedulableTriggerInputTypes?: any;
}

let _mod: NotificationsModule | null = null;
function mod(): NotificationsModule | null {
  if (!isNative) return null;
  if (_mod) return _mod;
  try {
    // require, not import — keeps it out of the web bundle.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _mod = require('expo-notifications');
    _mod!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    _mod = null;
  }
  return _mod;
}

export async function ensurePermission(): Promise<boolean> {
  const m = mod();
  if (!m) return false;
  const existing = await m.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const req = await m.requestPermissionsAsync();
  return req.status === 'granted';
}

/**
 * Schedule a daily reminder. Returns the platform notification id (so we
 * can cancel later) or null if the platform doesn't support notifications.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number
): Promise<string | null> {
  const m = mod();
  if (!m) return null;
  const granted = await ensurePermission();
  if (!granted) return null;
  return m.scheduleNotificationAsync({
    content: {
      title: 'PulseHealth',
      body: "Time to log a workout — keep your streak alive 🔥",
    },
    trigger: {
      // Different platforms have slightly different shapes; this works on both.
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelScheduled(id: string): Promise<void> {
  const m = mod();
  if (!m) return;
  try { await m.cancelScheduledNotificationAsync(id); } catch { /* already gone */ }
}

/**
 * Fire a one-shot local notification — used to celebrate a newly-unlocked
 * badge. No-op on web (we'll fall back to in-app Toast for that surface).
 */
export async function presentLocal(title: string, body: string): Promise<void> {
  const m = mod();
  if (!m || !m.presentNotificationAsync) return;
  try {
    await m.presentNotificationAsync({ title, body });
  } catch {
    // Don't let a notification failure break the calling flow.
  }
}

export const NotificationsAvailable = isNative;
