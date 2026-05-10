import { getPatientAssessmentHistory } from "@/src/api/assessmentApi";
import { getMe } from "@/src/api/authApi";
import { loadActiveSession } from "@/src/utils/sessionStorage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { SessionScores } from "../utils/difficultyEngine";

const FALLBACK_SESSION: SessionScores = {
  sessionId: "no-completed-assessment",
  totalScore: 0,
  sectionScores: {
    Orientation: 0,
    Registration: 0,
    Attention: 0,
    Recall: 0,
    Language: 0,
  },
};

interface AssessmentContextType {
  session: SessionScores;
  patientId: string | null;
  isLoadingSession: boolean;
  hasCompletedAssessment: boolean;
  error: string | null;
  setSession: (session: SessionScores) => void;
  refreshSession: () => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionScores>(FALLBACK_SESSION);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setIsLoadingSession(true);
    try {
      const meRes = await getMe();
      const currentPatientId =
        meRes?.success && meRes.data.user.role === "patient"
          ? meRes.data.user.id
          : null;

      setPatientId(currentPatientId);

      if (!currentPatientId) {
        setSession(FALLBACK_SESSION);
        setHasCompletedAssessment(false);
        setError("No patient account found for game difficulty.");
        return;
      }

      const activeSession = await loadActiveSession();

      if (
        activeSession?.status === "done" &&
        activeSession.patientId === currentPatientId
      ) {
        setSession({
          sessionId: activeSession.sessionId,
          totalScore: activeSession.totalScore,
          sectionScores: activeSession.sectionScores,
        });
        setHasCompletedAssessment(true);
        setError(null);
        return;
      }

      const sessions = await getPatientAssessmentHistory(currentPatientId);
      const latestDone = sessions.find((item) => item.status === "done");

      if (!latestDone) {
        setSession(FALLBACK_SESSION);
        setHasCompletedAssessment(false);
        setError(null);
        return;
      }

      setSession({
        sessionId: latestDone.sessionId,
        totalScore: latestDone.totalScore,
        sectionScores: latestDone.sectionScores,
      });
      setHasCompletedAssessment(true);
      setError(null);
    } catch (err) {
      setSession(FALLBACK_SESSION);
      setHasCompletedAssessment(false);
      setError(
        err instanceof Error ? err.message : "Failed to load screening result.",
      );
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AssessmentContext.Provider
      value={{
        session,
        patientId,
        isLoadingSession,
        hasCompletedAssessment,
        error,
        setSession,
        refreshSession,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used inside AssessmentProvider");
  return ctx;
}
