import { CheckInResult, DailyCheckIn } from '../../types/caregiver.types';

const BASE_URL     = `${process.env.EXPO_PUBLIC_API_URL}/api/caregiver/insights`;
const CAREGIVER_ID = '69ee5d4c6290eb858483e9f3'; 

export const submitCheckIn = async (
  data: DailyCheckIn
): Promise<CheckInResult> => {
  const res = await fetch(`${BASE_URL}/checkin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...data, caregiverId: CAREGIVER_ID }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.result;
};

export const getLatestResult = async (): Promise<CheckInResult | null> => {
  try {
    const res  = await fetch(`${BASE_URL}/latest/${CAREGIVER_ID}`);
    const json = await res.json();
    if (!json.success) return null;
    return json.result;
  } catch {
    return null;
  }
};