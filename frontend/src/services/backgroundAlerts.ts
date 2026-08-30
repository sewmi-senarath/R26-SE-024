/**
 * Background alert registration helper.
 * The task itself is defined in app/_layout.tsx (module root level - required by Expo).
 *
 * NOTE: `expo-notifications` is loaded lazily (via require) inside each function.
 * Importing it at module scope triggers its push-token auto-registration side
 * effect, which throws a hard error in Expo Go on SDK 53+ (remote push was
 * removed from Expo Go). Lazy-loading + the Expo Go guard keeps the app usable
 * in Expo Go; full notification support still requires a development build.
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as Speech from 'expo-speech';
import Constants from 'expo-constants';
import axios from 'axios';

export const ALERT_TASK = 'MEMOCARE_VOICE_ALERT';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:5000';

// true when running inside the Expo Go sandbox (not a dev/standalone build)
const isExpoGo = Constants.appOwnership === 'expo';

function getNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-notifications') as typeof import('expo-notifications');
}

export async function registerBackgroundAlerts(): Promise<boolean> {
  if (isExpoGo) return false; // background fetch + notifications unreliable in Expo Go
  try {
    const Notifications = getNotifications();
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    await BackgroundFetch.getStatusAsync();
    await BackgroundFetch.registerTaskAsync(ALERT_TASK, {
      minimumInterval: 30 * 60,
      stopOnTerminate: false,
      startOnBoot: false,
    });
    return true;
  } catch {
    return false;
  }
}

export async function unregisterBackgroundAlerts(): Promise<void> {
  try { await BackgroundFetch.unregisterTaskAsync(ALERT_TASK); } catch {}
}

export async function triggerAlertNow(patientId: string): Promise<string | null> {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/admin/behavior/voice-alert`,
      { patientId },
      { timeout: 10000 }
    );
    if (res.data.success && res.data.alert?.message) {
      const msg: string = res.data.alert.message;
      Speech.speak(msg, { language: 'en-US', rate: 0.9 });
      if (!isExpoGo) {
        try {
          const Notifications = getNotifications();
          await Notifications.scheduleNotificationAsync({
            content: { title: '⏰ MemoCare Reminder', body: msg, sound: true },
            trigger: null,
          });
        } catch {}
      }
      return msg;
    }
  } catch {}
  return null;
}
