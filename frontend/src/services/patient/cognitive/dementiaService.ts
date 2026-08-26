import { authFetch } from '@/src/api/authApi';
import {
  SeverityHistoryItem,
  SeverityPrediction,
} from '@/src/types/dementia.types';

// ── Severity prediction (train.py / dementia_model.pkl) ─────────────────────
// The backend pulls the patient's latest completed Assessment itself, so no
// body is required here - patientId in the URL is enough.
export const predictSeverity = async (patientId: string): Promise<SeverityPrediction> => {
  const json = await authFetch(`/cognitive/dementia/predict/${patientId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!json.success) throw new Error(json.message || 'Prediction failed');
  return json.result;
};

// ── History (for the Reporting tab) ─────────────────────────────────────────
export const getSeverityHistory = async (patientId: string): Promise<SeverityHistoryItem[]> => {
  try {
    const json = await authFetch(`/cognitive/dementia/predict/${patientId}/history`);
    if (!json.success) return [];
    return json.result;
  } catch {
    return [];
  }
};
