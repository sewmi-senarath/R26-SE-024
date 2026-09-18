
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CheckInResult, DailyCheckIn } from '../../types/caregiver.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/caregiver/insights`;

// Same storage helper as authApi.ts 
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return window.localStorage.getItem(key);
      return await AsyncStorage.getItem(key);
    } catch { return null; }
  },
};

const getCaregiverId = async (): Promise<string | null> => {
  return await storage.getItem('caregiverId');
};

export const submitCheckIn = async (
  data: DailyCheckIn
): Promise<CheckInResult> => {
  const caregiverId = await getCaregiverId();
  console.log('caregiverId:', caregiverId);

  if (!caregiverId) {
    throw new Error('Not logged in. Please log in first.');
  }

  const res = await fetch(`${BASE_URL}/checkin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...data, caregiverId }),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.result;
};

export const getLatestResult = async (): Promise<CheckInResult | null> => {
  try {
    const caregiverId = await getCaregiverId();
    if (!caregiverId) return null;

    const res  = await fetch(`${BASE_URL}/latest/${caregiverId}`);
    const json = await res.json();
    if (!json.success) return null;
    return json.result;
  } catch {
    return null;
  }
};