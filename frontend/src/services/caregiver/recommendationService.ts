import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SmartRecommendation } from '../../utils/recommendationEngine';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/caregiver/recommendations`;

// Storage helper 
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return window.localStorage.getItem(key);
      return await AsyncStorage.getItem(key);
    } catch { return null; }
  },
};

const getCaregiverId = async (): Promise<string | null> =>
  await storage.getItem('caregiverId');

// Submit feedback
export const submitFeedback = async (
  recommendation: SmartRecommendation,
  feedback:       'helpful' | 'not_helpful',
  stressLevel:    string,
  stressScore:    number,
): Promise<boolean> => {
  try {
    const caregiverId = await getCaregiverId();
    if (!caregiverId) return false;

    const res = await fetch(`${BASE_URL}/feedback`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        caregiverId,
        recommendationId: recommendation.id,
        category:         recommendation.category,
        title:            recommendation.title,
        feedback,
        stressLevel,
        stressScore,
      }),
    });
    const json = await res.json();
    return json.success;
  } catch (error) {
    console.log('Feedback error:', error);
    return false;
  }
};

// Get priorities based on feedback history 
export const getRecommendationPriorities = async (): Promise<{
  boosted:    string[];
  suppressed: string[];
}> => {
  try {
    const caregiverId = await getCaregiverId();
    if (!caregiverId) return { boosted: [], suppressed: [] };

    const res  = await fetch(`${BASE_URL}/priorities/${caregiverId}`);
    const json = await res.json();

    if (!json.success) return { boosted: [], suppressed: [] };
    return {
      boosted:    json.boosted    || [],
      suppressed: json.suppressed || [],
    };
  } catch {
    return { boosted: [], suppressed: [] };
  }
};