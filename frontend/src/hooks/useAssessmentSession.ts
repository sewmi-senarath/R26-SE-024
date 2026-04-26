// session state manager
import {
  IMPAIRMENT_THRESHOLD,
  MMSE_QUESTIONS,
  TOTAL_QUESTIONS,
} from "@/src/constants/questions";
import { MMSESession } from "@/src/types/assessment.types";
import { useCallback, useEffect, useRef, useState } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import {
  buildScoringLog,
  computeSectionScores,
  computeSeverity,
  computeTotalScore,
} from "../utils/scoring";
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
    sessionId: uuidv4(),
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

  const startSession = useCallback(() => {
    if (!session) return;
    questionStartRef.current = Date.now();
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: "active",
            questionStartTime: Date.now(),
            timeLimit: MMSE_QUESTIONS[0].timeLimit ?? null,
          }
        : null,
    );
  }, [session]);

  const submitAnswer = useCallback(
    (questionId: string, answer: any) => {
      if (!session) return;
      const timeSpent = Date.now() - questionStartRef.current;

      setSession((prev) => {
        if (!prev) return null;

        const newAnswers = { ...prev.answers, [questionId]: answer };
        const newAnsweredAt = { ...prev.answeredAt, [questionId]: Date.now() };
        const newTimePerQ = {
          ...prev.timePerQuestion,
          [questionId]: timeSpent,
        };

        const recallWordsShown =
          prev.recallWordsShown || questionId === "registration";
        const serial7Attempted =
          prev.serial7Attempted || questionId === "attention_serial7";

        const updatedSession = {
          ...prev,
          answers: newAnswers,
          answeredAt: newAnsweredAt,
          timePerQuestion: newTimePerQ,
          recallWordsShown,
          serial7Attempted,
        };

        const sectionScores = computeSectionScores(newAnswers, updatedSession);
        const totalScore = computeTotalScore(sectionScores);
        const scoringLog = buildScoringLog(newAnswers, updatedSession);

        return {
          ...updatedSession,
          sectionScores,
          totalScore,
          scoringLog,
          impairmentFlag: totalScore <= IMPAIRMENT_THRESHOLD,
          severity: computeSeverity(totalScore),
        };
      });
    },
    [session],
  );

  const goToNext = useCallback(() => {
    if (!session) return;
    setSession((prev) => {
      if (!prev) return null;
      const nextIndex = prev.currentQuestionIndex + 1;
      const isDone = nextIndex >= prev.totalQuestions;
      questionStartRef.current = Date.now();

      return {
        ...prev,
        currentQuestionIndex: isDone ? prev.currentQuestionIndex : nextIndex,
        status: isDone ? "done" : "active",
        completedAt: isDone ? new Date().toISOString() : null,
        questionStartTime: Date.now(),
        timeLimit: isDone
          ? null
          : (MMSE_QUESTIONS[nextIndex]?.timeLimit ?? null),
        timeExpired: false,
      };
    });
  }, [session]);

  const goToPrev = useCallback(() => {
    if (!session) return;
    setSession((prev) => {
      if (!prev || prev.currentQuestionIndex === 0) return prev;
      const prevIndex = prev.currentQuestionIndex - 1;
      questionStartRef.current = Date.now();
      return {
        ...prev,
        currentQuestionIndex: prevIndex,
        timeLimit: MMSE_QUESTIONS[prevIndex]?.timeLimit ?? null,
        timeExpired: false,
      };
    });
  }, [session]);

  const markTimeExpired = useCallback(() => {
    if (!session) return;
    setSession((prev) => (prev ? { ...prev, timeExpired: true } : null));
  }, [session]);

  const skipQuestion = useCallback(
    (questionId: string) => {
      if (!session) return;
      setSession((prev) =>
        prev
          ? {
              ...prev,
              skipped: [...prev.skipped, questionId],
            }
          : null,
      );
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
