/**
 * Voice Command Logic - Object Finder with GPS + Navigation
 */
import * as Speech from 'expo-speech';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:5000';

const OBJECT_KEYWORDS = [
  'toothbrush', 'brush', 'spectacles', 'glasses', 'specs', 'keys', 'key',
  'phone', 'mobile', 'wallet', 'purse', 'bag', 'medicine', 'tablets',
  'pills', 'remote', 'tv remote', 'cup', 'mug', 'book', 'pen', 'comb',
  'shoes', 'slippers', 'watch', 'charger', 'bottle', 'umbrella', 'stick',
  'cane', 'newspaper', 'towel', 'soap',
];

const KEYWORD_MAP: Record<string, string> = {
  brush: 'toothbrush',
  glasses: 'spectacles',
  specs: 'spectacles',
  mobile: 'phone',
  tablets: 'medicine',
  pills: 'medicine',
  slippers: 'shoes',
  stick: 'cane',
  'tv remote': 'remote',
};

export function normaliseKeyword(word: string): string {
  const lc = word.toLowerCase().trim();
  return KEYWORD_MAP[lc] || lc;
}

export function extractObjectKeyword(text: string): string | null {
  const t = text.toLowerCase();
  // Try multi-word keywords first
  for (const kw of ['tv remote']) {
    if (t.includes(kw)) return normaliseKeyword(kw);
  }
  for (const kw of OBJECT_KEYWORDS) {
    if (t.includes(kw)) return normaliseKeyword(kw);
  }
  return null;
}

export interface FindResult {
  found: boolean;
  message: string;
  distanceLabel?: string;
  roomLabel?: string;
  locationDetail?: string;
  timeLabel?: string;
  spokenMessage?: string;
  // GPS coordinates of saved object location (for map navigation)
  objLat?: number;
  objLng?: number;
}

/**
 * Find last known object location. Speaks navigation. Returns full result for map.
 */
export async function findAndSpeakLocation(
  patientId: string,
  keyword: string,
  patientName: string = 'there',
  userLat?: number,
  userLng?: number,
): Promise<FindResult> {
  try {
    const params: Record<string, string> = { q: keyword };
    if (userLat != null) params.lat = String(userLat);
    if (userLng != null) params.lng = String(userLng);

    const res = await axios.get(
      `${BASE_URL}/api/admin/behavior/find-object/${patientId}`,
      { params, timeout: 8000 }
    );

    if (!res.data.found) {
      const msg = `${patientName}, I have not recorded where your ${keyword} is yet. Please scan it with the camera first.`;
      Speech.speak(msg, { language: 'en-US', rate: 0.88 });
      return { found: false, message: msg };
    }

    const { roomLabel, locationDetail, timeLabel, distanceLabel, spokenMessage, coordinates } = res.data;

    const distPart = distanceLabel ? ` · 📍 ${distanceLabel}` : '';
    const displayMsg = `${keyword} → ${roomLabel}${distPart}  (${timeLabel})`;

    Speech.speak(spokenMessage, { language: 'en-US', rate: 0.85, pitch: 1.0 });

    return {
      found: true,
      message: displayMsg,
      distanceLabel,
      roomLabel,
      locationDetail,
      timeLabel,
      spokenMessage,
      objLat: coordinates?.lat ?? undefined,
      objLng: coordinates?.lng ?? undefined,
    };
  } catch {
    const msg = `${patientName}, I could not connect right now. Please check your WiFi.`;
    Speech.speak(msg, { language: 'en-US', rate: 0.88 });
    return { found: false, message: msg };
  }
}
