// Types for the two ML models served by backend/ml/dementia/app.py:
//  1) severity classifier   -> /api/cognitive/dementia/predict/:patientId
//  2) behavioral screener   -> /api/cognitive/dementia/screen/:patientId

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

export type RiskLevel = 'low' | 'moderate' | 'high';

// Behavioral checklist - things a caregiver/family member can observe
// without the patient taking any cognitive test.
export interface RiskChecklist {
  memoryComplaints: boolean;
  behavioralProblems: boolean;
  confusion: boolean;
  disorientation: boolean;
  personalityChanges: boolean;
  difficultyCompletingTasks: boolean;
  forgetfulness: boolean;

  age?: number;
  gender?: 'M' | 'F' | '';
  educationLevel?: number; // 0=None,1=High School,2=Bachelor's,3=Higher
  smoking?: boolean;
  familyHistoryAlzheimers?: boolean;
  cardiovascularDisease?: boolean;
  diabetes?: boolean;
  depression?: boolean;
  headInjury?: boolean;
  hypertension?: boolean;
}

export const DEFAULT_RISK_CHECKLIST: RiskChecklist = {
  memoryComplaints: false,
  behavioralProblems: false,
  confusion: false,
  disorientation: false,
  personalityChanges: false,
  difficultyCompletingTasks: false,
  forgetfulness: false,
  age: undefined,
  gender: '',
  educationLevel: 1,
  smoking: false,
  familyHistoryAlzheimers: false,
  cardiovascularDisease: false,
  diabetes: false,
  depression: false,
  headInjury: false,
  hypertension: false,
};

export interface RiskResult {
  riskProbability: number; // 0-1
  riskLevel: RiskLevel;
  message: string;
  topFactors: string[];
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

export interface RiskHistoryItem {
  _id: string;
  patientId: string;
  checklist: Record<string, boolean>;
  riskProbability: number;
  riskLevel: RiskLevel;
  topFactors: string[];
  message: string;
  createdAt: string;
}

export const EDUCATION_LEVELS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'High School' },
  { value: 2, label: "Bachelor's" },
  { value: 3, label: 'Higher' },
];

export const BEHAVIORAL_QUESTIONS: {
  key: keyof Pick<
    RiskChecklist,
    | 'memoryComplaints'
    | 'behavioralProblems'
    | 'confusion'
    | 'disorientation'
    | 'personalityChanges'
    | 'difficultyCompletingTasks'
    | 'forgetfulness'
  >;
  question: string;
}[] = [
  { key: 'memoryComplaints', question: 'Do they repeat questions or forget recent conversations?' },
  { key: 'forgetfulness', question: 'General forgetfulness beyond normal aging?' },
  { key: 'confusion', question: 'Do they seem confused about time or surroundings?' },
  { key: 'disorientation', question: 'Do they get lost or disoriented in familiar places?' },
  { key: 'difficultyCompletingTasks', question: 'Trouble finishing everyday tasks (cooking, bills, etc.)?' },
  { key: 'personalityChanges', question: 'Noticeable changes in mood or personality?' },
  { key: 'behavioralProblems', question: 'Any other unusual or concerning behavior recently?' },
];

export const MEDICAL_HISTORY_QUESTIONS: {
  key: keyof Pick<
    RiskChecklist,
    'familyHistoryAlzheimers' | 'cardiovascularDisease' | 'diabetes' | 'depression' | 'headInjury' | 'hypertension'
  >;
  label: string;
}[] = [
  { key: 'familyHistoryAlzheimers', label: "Family history of Alzheimer's" },
  { key: 'cardiovascularDisease', label: 'Cardiovascular disease' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'depression', label: 'Depression' },
  { key: 'headInjury', label: 'History of head injury' },
  { key: 'hypertension', label: 'Hypertension' },
];
