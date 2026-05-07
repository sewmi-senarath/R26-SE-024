// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';

// // ✅ Works for both web and mobile
// const BASE_URL = 'http://192.168.1.6:5000/api';

// const storage = {
// getItem: async (key: string): Promise<string | null> => {
//   try {
//     if (Platform.OS === 'web') {
//       const value = window.localStorage.getItem(key);
//       console.log(`storage.getItem(${key}):`, value ? 'found' : 'null');
//       return value;
//     }
//     return await AsyncStorage.getItem(key);
//   } catch (e) {
//     console.log('storage.getItem error:', e);
//     return null;
//   }
// },
//   setItem: async (key: string, value: string): Promise<void> => {
//     try {
//       if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
//       await AsyncStorage.setItem(key, value);
//     } catch { }
//   },
//   multiRemove: async (keys: string[]): Promise<void> => {
//     try {
//       if (Platform.OS === 'web') { keys.forEach(k => localStorage.removeItem(k)); return; }
//       await AsyncStorage.multiRemove(keys);
//     } catch { }
//   },
// };

// export const registerUser = async (
//   fullName: string,
//   email: string,
//   password: string,
//   role: 'patient' | 'caregiver' | 'family'
// ) => {
//   try {
//     const response = await fetch(`${BASE_URL}/auth/register`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ fullName, email, password, role }),
//     });
//     return await response.json();
//   } catch (error) {
//     return { success: false, message: 'Cannot connect to server.' };
//   }
// };

// export const loginUser = async (email: string, password: string) => {
//   try {
//     const response = await fetch(`${BASE_URL}/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });
//     const data = await response.json();

//     if (data.success) {
//       await storage.setItem('accessToken', data.data.accessToken);
//       await storage.setItem('refreshToken', data.data.refreshToken);
//       await storage.setItem('userRole', data.data.user.role);
//       await storage.setItem('userData', JSON.stringify(data.data.user));
//     }
//     return data;
//   } catch (error) {
//     return { success: false, message: 'Cannot connect to server.' };
//   }
// };

// export const getAccessToken = async (): Promise<string | null> => {
//   return await storage.getItem('accessToken');
// };

// export const getStoredUser = async () => {
//   try {
//     const userData = await storage.getItem('userData');
//     return userData ? JSON.parse(userData) : null;
//   } catch {
//     return null;
//   }
// };

// export const getStoredRole = async (): Promise<string | null> => {
//   return await storage.getItem('userRole');
// };
// export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
//   try {
//     const token = await getAccessToken();
//     console.log('authFetch token:', token ? 'exists' : 'NULL'); // ← ADD THIS
    
//     const response = await fetch(`${BASE_URL}${endpoint}`, {
//       ...options,
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//         ...options.headers,
//       },
//     });
//     return await response.json();
//   } catch (error) {
//     return { success: false, message: 'Cannot connect to server.' };
//   }
// };
// export const logoutUser = async () => {
//   try {
//     await authFetch('/auth/logout', { method: 'POST' });
//   } catch { }
//   await storage.multiRemove(['accessToken', 'refreshToken', 'userRole', 'userData']);
// };

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

// ✅ Web-safe storage
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        keys.forEach(k => window.localStorage.removeItem(k));
        return;
      }
      await AsyncStorage.multiRemove(keys);
    } catch {}
  },
};

// ✅ Now accepts extraData for patient profile fields
export const registerUser = async (
  fullName:   string,
  email:      string,
  password:   string,
  role:       'patient' | 'caregiver' | 'family',
  extraData?: Record<string, any>
) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role, ...extraData }),
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
      await storage.setItem('accessToken',  data.data.accessToken);
      await storage.setItem('refreshToken', data.data.refreshToken);
      await storage.setItem('userRole',     data.data.user.role);
      await storage.setItem('userData',     JSON.stringify(data.data.user));
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
    // ✅ Read token directly from storage
    let token: string | null = null;
    if (Platform.OS === 'web') {
      token = window.localStorage.getItem('accessToken');
    } else {
      token = await AsyncStorage.getItem('accessToken');
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    // ✅ Auto refresh if token expired
    if (!data.success && data.message === 'Token expired. Please login again.') {
      const refreshToken = Platform.OS === 'web'
        ? window.localStorage.getItem('refreshToken')
        : await AsyncStorage.getItem('refreshToken');

      if (refreshToken) {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshData = await refreshResponse.json();

        if (refreshData.success) {
          const newToken = refreshData.data.accessToken;
          await storage.setItem('accessToken', newToken);

          // ✅ Retry with new token
          const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
              ...options.headers,
            },
          });
          return await retryResponse.json();
        } else {
          await storage.multiRemove(['accessToken', 'refreshToken', 'userRole', 'userData']);
          return { success: false, message: 'Session expired. Please login again.' };
        }
      }
    }

    return data;
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