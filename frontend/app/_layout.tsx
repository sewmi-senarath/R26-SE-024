import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:5000';
export const ALERT_TASK = 'MEMOCARE_VOICE_ALERT';

// ── Configure notifications appearance ───────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── MUST be defined at module level before any registration ───────────────────
TaskManager.defineTask(ALERT_TASK, async () => {
  try {
    const stored = await AsyncStorage.getItem('patient');
    if (!stored) return BackgroundFetch.BackgroundFetchResult.NoData;

    const patient = JSON.parse(stored);
    const res = await axios.post(
      `${BASE_URL}/api/admin/behavior/voice-alert`,
      { patientId: patient.id },
      { timeout: 10000 }
    );

    if (res.data.success && res.data.alert?.speak) {
      const message: string = res.data.alert.message;
      await Notifications.scheduleNotificationAsync({
        content: { title: '⏰ MemoCare Reminder', body: message, sound: true },
        trigger: null,
      });
      Speech.speak(message, { language: 'en-US', rate: 0.9 });
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerTitle: "MemoCare",
        }}
      />
    </GestureHandlerRootView>
  );
}