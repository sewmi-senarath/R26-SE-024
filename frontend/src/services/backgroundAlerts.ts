/**
 * Background alert registration helper.
 * The task itself is defined in app/_layout.tsx (module root level - required by Expo).
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import axios from 'axios';

export const ALERT_TASK = 'MEMOCARE_VOICE_ALERT';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:5000';

export async function registerBackgroundAlerts(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  try {
    const registered = await BackgroundFetch.getStatusAsync();
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
      await Notifications.scheduleNotificationAsync({
        content: { title: '⏰ MemoCare Reminder', body: msg, sound: true },
        trigger: null,
      });
      return msg;
    }
  } catch {}
  return null;
}
