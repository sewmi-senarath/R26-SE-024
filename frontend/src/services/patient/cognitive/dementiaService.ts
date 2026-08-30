import { authFetch } from '@/src/api/authApi';
import {
  FaqAnswers,
  FunctionalAssessment,
  TriageHistoryItem,
  TriagePrediction,
} from '@/src/types/dementia.types';

// ── Triage prediction (backend/ml/dementia -> /predict) ─────────────────────
// The backend pulls the patient's latest completed Assessment + latest FAQ
// itself, so no body is required - patientId in the URL is enough. Returns a
// { code: 'FAQ_REQUIRED' } body (success:false) if the questionnaire is missing.
export const predictTriage = async (patientId: string): Promise<TriagePrediction> => {
  const json = await authFetch(`/cognitive/dementia/predict/${patientId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!json.success) {
    const err = new Error(json.message || 'Prediction failed') as Error & { code?: string };
    err.code = json.code;
    throw err;
  }
  return json.result;
};

// ── Functional Activities Questionnaire ─────────────────────────────────────
export const submitFaq = async (
  patientId: string,
  answers: FaqAnswers,
  sessionId?: string | null,
): Promise<FunctionalAssessment> => {
  const json = await authFetch(`/cognitive/dementia/faq/${patientId}`, {
    method: 'POST',
    body: JSON.stringify({ answers, sessionId: sessionId ?? undefined }),
  });
  if (!json.success) throw new Error(json.message || 'Could not save the questionnaire');
  return json.result;
};

export const getLatestFaq = async (
  patientId: string,
): Promise<FunctionalAssessment | null> => {
  try {
    const json = await authFetch(`/cognitive/dementia/faq/${patientId}/latest`);
    if (!json.success) return null;
    return json.result ?? null;
  } catch {
    return null;
  }
};

// ── History (for the Reporting tab) ────────────────────────────────────────
export const getTriageHistory = async (
  patientId: string,
): Promise<TriageHistoryItem[]> => {
  try {
    const json = await authFetch(`/cognitive/dementia/predict/${patientId}/history`);
    if (!json.success) return [];
    return json.result;
  } catch {
    return [];
  }
};
