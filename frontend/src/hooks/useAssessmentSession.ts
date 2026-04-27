import {
  MMSE_QUESTIONS,
  TOTAL_QUESTIONS,
} from "@/src/constants/questions";
import { MMSESession } from "@/src/types/assessment.types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeSession as completeSessionApi,
  startSession as startSessionApi,
  submitAnswer as submitAnswerApi,
  updateSessionProgress,
} from "../api/assessmentApi";
import { loadSession, saveSession } from "../utils/sessionStorage";

function buildInitialSession(
  patientId: string,
  caregiverId: string,
): MMSESession {
  return {
    currentQuestionIndex: 0,
    totalQuestions: TOTAL_QUESTIONS,
    status: "idle",
    answers: {},
    answeredAt: {},
    timePerQuestion: {},
    attemptCount: {},
    skipped: [],
    registrationWords: ["Apple", "Table", "Penny"],
    sectionScores: {
      Orientation: 0,
      Registration: 0,
      Attention: 0,
      Recall: 0,
      Language: 0,
    },
    totalScore: 0,
    attentionMethod: "serial7",
    adjustedScore: null,
    impairmentFlag: false,
    severity: "none",
    scoringLog: [],
    serial7Attempted: false,
    worldSpellingFallback: false,
    recallWordsShown: false,
    questionStartTime: 0,
    timeLimit: null,
    timeExpired: false,
    sessionId: "",
    patientId,
    caregiverId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    locale: "en-AU",
    administrationMode: "assisted",
  };
}

export function useAssessmentSession(patientId: string, caregiverId: string) {
  const [session, setSession] = useState<MMSESession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const questionStartRef = useRef<number>(Date.now());

  // ── Load session from storage on mount ──────────────────────
  useEffect(() => {
    const initSession = async () => {
      const stored = await loadSession(patientId, caregiverId);

      if (stored) {
        setSession(stored);
      } else {
        setSession(buildInitialSession(patientId, caregiverId));
      }
      setIsLoading(false);
    };

    initSession();
  }, [patientId, caregiverId]);

  const startSession = useCallback(async () => {
    const started = await startSessionApi({
      patientId,
      caregiverId,
      locale: "en-AU",
      administrationMode: "assisted",
    });
    questionStartRef.current = Date.now();
    setSession(started);
    return started;
  }, [patientId, caregiverId]);

  const submitAnswer = useCallback(
    async (questionId: string, answer: any) => {
      if (!session) return;
      const timeSpent = Date.now() - questionStartRef.current;
      const updated = await submitAnswerApi(session.sessionId, {
        questionId,
        answer,
        timeSpentMs: timeSpent,
        answeredAt: Date.now(),
      });
      setSession(updated);
      return updated;
    },
    [session],
  );

  const goToNext = useCallback(() => {
    if (!session) return;
    const run = async () => {
      const nextIndex = session.currentQuestionIndex + 1;
      const isDone = nextIndex >= session.totalQuestions;
      questionStartRef.current = Date.now();

      if (isDone) {
        const completed = await completeSessionApi(session.sessionId);
        setSession(completed);
        return completed;
      }

      const progressed = await updateSessionProgress(session.sessionId, {
        currentQuestionIndex: nextIndex,
        questionStartTime: Date.now(),
        timeLimit: MMSE_QUESTIONS[nextIndex]?.timeLimit ?? null,
        timeExpired: false,
      });
      setSession(progressed);
      return progressed;
    };
    return run();
  }, [session]);

  const goToPrev = useCallback(() => {
    if (!session) return;
    if (session.currentQuestionIndex === 0) return;
    const run = async () => {
      const prevIndex = session.currentQuestionIndex - 1;
      questionStartRef.current = Date.now();
      const progressed = await updateSessionProgress(session.sessionId, {
        currentQuestionIndex: prevIndex,
        questionStartTime: Date.now(),
        timeLimit: MMSE_QUESTIONS[prevIndex]?.timeLimit ?? null,
        timeExpired: false,
      });
      setSession(progressed);
      return progressed;
    };
    return run();
  }, [session]);

  const markTimeExpired = useCallback(() => {
    if (!session) return;
    const run = async () => {
      const progressed = await updateSessionProgress(session.sessionId, {
        timeExpired: true,
      });
      setSession(progressed);
      return progressed;
    };
    return run();
  }, [session]);

  const skipQuestion = useCallback(
    (questionId: string) => {
      if (!session) return;
      const run = async () => {
        const updated = await submitAnswerApi(session.sessionId, {
          questionId,
          answer: null,
          skipped: true,
          answeredAt: Date.now(),
        });
        setSession(updated);
        return updated;
      };
      return run();
    },
    [session],
  );

  // ── Auto-persist every time session changes ──────────────────
  useEffect(() => {
    if (!session || session.status === "idle") return;
    saveSession(session);
  }, [session]);

  const currentQuestion = session
    ? MMSE_QUESTIONS[session.currentQuestionIndex]
    : null;
  const progressPercent = session
    ? (session.currentQuestionIndex / session.totalQuestions) * 100
    : 0;
  const isAnswered = (id: string) => (session ? id in session.answers : false);

  return {
    session: session || buildInitialSession(patientId, caregiverId),
    currentQuestion,
    progressPercent,
    isAnswered,
    isLoading,
    startSession,
    submitAnswer,
    goToNext,
    goToPrev,
    markTimeExpired,
    skipQuestion,
  };
}
