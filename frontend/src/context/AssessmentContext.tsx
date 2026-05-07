import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SessionScores } from '../utils/difficultyEngine';

// Default mock session — replace with real MMSE session data
// when you wire up the full assessment flow
const DEFAULT_SESSION: SessionScores = {
  sessionId: 'default-session',
  totalScore: 18,
  sectionScores: {
    Orientation: 6,
    Registration: 2,
    Attention: 3,
    Recall: 2,
    Language: 5,
  },
};

interface AssessmentContextType {
  session: SessionScores;
  setSession: (session: SessionScores) => void;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionScores>(DEFAULT_SESSION);

  return (
    <AssessmentContext.Provider value={{ session, setSession }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used inside AssessmentProvider');
  return ctx;
}