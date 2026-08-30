// Types for the dementia triage model served by backend/ml/dementia/app.py:
//  2-class triage -> /api/cognitive/dementia/predict/:patientId
//  questionnaire  -> /api/cognitive/dementia/faq/:patientId

export type TriageLevel = 'monitor' | 'escalate';

export interface TriagePrediction {
  triage: TriageLevel;
  confidence: number; // 0-1
  probabilities: Record<TriageLevel, number>;
  message: string;
  basedOnAssessment: string;
  basedOnFaq: string;
  submittedAt: string;
}

// ── History items (persisted rows, for the Reporting tab) ──────────────────
export interface TriageHistoryItem {
  _id: string;
  patientId: string;
  basedOnAssessment: string | null;
  basedOnFaq: string | null;
  triage: TriageLevel;
  confidence: number;
  probabilities: Record<TriageLevel, number>;
  message: string;
  createdAt: string;
}

// ── Functional Activities Questionnaire (FAQ) ─────────────────────────────
// 10 items, each 0 (normal) .. 3 (someone else does it for them now).
export const FAQ_ITEMS = [
  'bills',
  'taxes',
  'shopping',
  'games',
  'stove',
  'mealPrep',
  'events',
  'payAttention',
  'remindDates',
  'travel',
] as const;

export type FaqItem = (typeof FAQ_ITEMS)[number];
export type FaqAnswers = Record<FaqItem, number>;

export interface FunctionalAssessment extends FaqAnswers {
  _id: string;
  patientId: string;
  basedOnAssessment: string | null;
  total: number;
  createdAt: string;
}

export interface FaqQuestion {
  key: FaqItem;
  prompt: string; // plain-English, older-adult friendly
  checks: string; // one-line "what this measures", for the caregiver
}

// Wording drafted for older adults - keeps the ability each NACC item measures.
export const FAQ_QUESTIONS: FaqQuestion[] = [
  { key: 'bills',        prompt: 'Managing money — paying bills on time, handling cash or a bank card, checking the change or a receipt is right', checks: 'Number sense, following steps' },
  { key: 'taxes',        prompt: 'Dealing with paperwork and official matters — forms, letters from the bank, insurance or government, keeping documents in order', checks: 'Handling complex, multi-step tasks' },
  { key: 'shopping',     prompt: 'Going to the shops alone — buying groceries or household things and paying for them', checks: 'Independent errands, memory, money' },
  { key: 'games',        prompt: 'Doing a hobby that needs focus — cards, board games, puzzles, gardening, knitting, an instrument', checks: 'Sustained attention, skill' },
  { key: 'stove',        prompt: 'Making a hot drink or snack safely — boiling the kettle or using the stove, and remembering to turn it off', checks: 'Simple routine task, safety' },
  { key: 'mealPrep',     prompt: 'Cooking a full meal — deciding what to make, getting everything together, having it ready at the right time', checks: 'Planning and sequencing' },
  { key: 'events',       prompt: "Keeping up with what's going on — news, family updates, local happenings — and remembering it later", checks: 'Taking in and holding new information' },
  { key: 'payAttention', prompt: 'Following a TV show, film, or a conversation, and being able to talk about it afterwards', checks: 'Attention, understanding, recall' },
  { key: 'remindDates',  prompt: 'Remembering appointments, medications, birthdays and family occasions without being reminded', checks: 'Prospective memory' },
  { key: 'travel',       prompt: 'Getting around outside the home alone — driving, walking to familiar places, or taking a bus or taxi — without getting lost', checks: 'Navigation, planning, independence' },
];

export const FAQ_CHOICES: { value: number; label: string }[] = [
  { value: 0, label: 'Normal — or never did this, but could if needed' },
  { value: 1, label: "Does it alone, but it's harder than before" },
  { value: 2, label: 'Needs some help' },
  { value: 3, label: 'Someone else does it for them now' },
];
