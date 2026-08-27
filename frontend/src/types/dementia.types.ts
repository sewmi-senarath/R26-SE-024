// Types for the severity classifier served by backend/ml/dementia/app.py:
//  severity classifier -> /api/cognitive/dementia/predict/:patientId

export type SeverityLevel = 'none' | 'mild' | 'moderate' | 'severe';

export interface SeverityPrediction {
  severity: SeverityLevel;
  confidence: number; // 0-1
  probabilities: Record<SeverityLevel, number>;
  ruleBasedSeverity: SeverityLevel;
  agreesWithRule: boolean;
  message: string;
  basedOnAssessment: string;
  submittedAt: string;
}

// ── History items (persisted rows, for the Reporting tab) ──────────────────
export interface SeverityHistoryItem {
  _id: string;
  patientId: string;
  basedOnAssessment: string | null;
  severity: SeverityLevel;
  confidence: number;
  probabilities: Record<SeverityLevel, number>;
  ruleBasedSeverity: SeverityLevel;
  agreesWithRule: boolean;
  message: string;
  createdAt: string;
}
