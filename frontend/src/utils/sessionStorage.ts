// persist session to AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMSESession } from '@/src/types/assessment.types';

const KEY = (sessionId: string) => `mmse_session_${sessionId}`;

export async function saveSession(session: MMSESession): Promise<void> {
  await AsyncStorage.setItem(KEY(session.sessionId), JSON.stringify(session));
}

export async function loadSession(sessionId: string): Promise<MMSESession | null> {
  const raw = await AsyncStorage.getItem(KEY(sessionId));
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession(sessionId: string): Promise<void> {
  await AsyncStorage.removeItem(KEY(sessionId));
}