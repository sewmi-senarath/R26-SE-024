import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ✅ Works for both web and mobile
const BASE_URL = 'http://192.168.1.6:5000/api';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(key);
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      if (Platform.OS === 'web') { keys.forEach(k => localStorage.removeItem(k)); return; }
      await AsyncStorage.multiRemove(keys);
    } catch {}
  },
};

export const registerUser = async (
  fullName: string,
  email: string,
  password: string,
  role: 'patient' | 'caregiver' | 'family'
) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Cannot connect to server.' };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (data.success) {
      await storage.setItem('accessToken', data.data.accessToken);
      await storage.setItem('refreshToken', data.data.refreshToken);
      await storage.setItem('userRole', data.data.user.role);
      await storage.setItem('userData', JSON.stringify(data.data.user));
    }
    return data;
  } catch (error) {
    return { success: false, message: 'Cannot connect to server.' };
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return await storage.getItem('accessToken');
};

export const getStoredUser = async () => {
  try {
    const userData = await storage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

export const getStoredRole = async (): Promise<string | null> => {
  return await storage.getItem('userRole');
};

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Cannot connect to server.' };
  }
};

export const logoutUser = async () => {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch {}
  await storage.multiRemove(['accessToken', 'refreshToken', 'userRole', 'userData']);
};