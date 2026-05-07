import { MMSESession, Question } from "@/src/types/assessment.types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeSession as completeSessionApi,
  startSession as startSessionApi,
  submitAnswer as submitAnswerApi,
  updateSessionProgress,
} from "../api/assessmentApi";
import {
  loadActiveSession,
  loadSession,
  saveSession,
} from "../utils/sessionStorage";

type StartSessionOptions = {
  patientId?: string;
  caregiverId?: string;
  locale?: string;
  administrationMode?: "assisted" | "self";
};

function buildInitialSession(
  patientId: string,
  caregiverId: string,
  totalQuestions: number,
): MMSESession {
  return {
    currentQuestionIndex: 0,
    totalQuestions,
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

export function useAssessmentSession(patientId?: string, caregiverId?: string) {
  const [session, setSession] = useState<MMSESession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  // 1. Fetch questions from API on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const url = `${process.env.EXPO_PUBLIC_API_URL}/api/cognitive/questions`;
        const res = await fetch(url);
        if (!res.ok)
          throw new Error(`Failed to fetch questions: ${res.status}`);

        const json = await res.json();

        // Handle both: data: []  OR  data: { questions: [] }
        const rawQuestions = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.data?.questions)
            ? json.data.questions
            : [];

        // Normalize backend shape -> frontend shape
        const normalized = rawQuestions.map((q: any) => ({
          ...q,
          id: q.id ?? q.questionId,
        }));

        setQuestions(normalized);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setQuestions([]);
      }
    };

    fetchQuestions();
  }, []);

  // 2. Initialize session after questions are loaded
  useEffect(() => {
    if (questions.length === 0) return;

    const initSession = async () => {
      try {
        if (patientId && caregiverId) {
          const stored = await loadSession(patientId, caregiverId);
          setSession(
            stored ||
              buildInitialSession(patientId, caregiverId, questions.length),
          );
        } else {
          const active = await loadActiveSession();
          if (!active) {
            setError("No active assessment session found.");
            setSession(null);
            return;
          }
          setSession(active);
        }
        setError(null);
      } catch (err) {
        console.error("Error loading session:", err);
        if (patientId && caregiverId) {
          setSession(
            buildInitialSession(patientId, caregiverId, questions.length),
          );
        } else {
          setSession(null);
          setError("Failed to load assessment session.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, [questions, patientId, caregiverId]);

  const startSession = useCallback(
    async (options: StartSessionOptions = {}) => {
      const effectivePatientId =
        options.patientId || patientId || session?.patientId;
      const effectiveCaregiverId =
        options.caregiverId || caregiverId || session?.caregiverId;

      if (!effectivePatientId || !effectiveCaregiverId) {
        throw new Error("Missing patient or caregiver ID");
      }

      const started = await startSessionApi({
        patientId: effectivePatientId,
        caregiverId: effectiveCaregiverId,
        locale: options.locale || "en-AU",
        administrationMode: options.administrationMode || "assisted",
      });
      questionStartRef.current = Date.now();
      setSession(started);
      await saveSession(started);
      return started;
    },
    [patientId, caregiverId, session?.patientId, session?.caregiverId],
  );

  const submitAnswer = useCallback(
    async (questionId: string, answer: any) => {
      if (!session) return;
      const updated = await submitAnswerApi(session.sessionId, {
        questionId,
        answer,
        timeSpentMs: Date.now() - questionStartRef.current,
        answeredAt: Date.now(),
      });
      setSession(updated);
      await saveSession(updated);
      return updated;
    },
    [session],
  );

  const goToNext = useCallback(async () => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;
    const isDone = nextIndex >= session.totalQuestions;
    questionStartRef.current = Date.now();

    if (isDone) {
      const completed = await completeSessionApi(session.sessionId);
      setSession(completed);
      await saveSession(completed);
      return completed;
    }

    const nextQuestion = questions[nextIndex];
    const progressed = await updateSessionProgress(session.sessionId, {
      currentQuestionIndex: nextIndex,
      questionStartTime: Date.now(),
      timeLimit: nextQuestion?.timeLimit ?? null,
      timeExpired: false,
    });
    setSession(progressed);
    await saveSession(progressed);
    return progressed;
  }, [session, questions]);

  const goToPrev = useCallback(async () => {
    if (!session || session.currentQuestionIndex === 0) return;

    const prevIndex = session.currentQuestionIndex - 1;
    questionStartRef.current = Date.now();

    const prevQuestion = questions[prevIndex];
    const progressed = await updateSessionProgress(session.sessionId, {
      currentQuestionIndex: prevIndex,
      questionStartTime: Date.now(),
      timeLimit: prevQuestion?.timeLimit ?? null,
      timeExpired: false,
    });
    setSession(progressed);
    await saveSession(progressed);
    return progressed;
  }, [session, questions]);

  const markTimeExpired = useCallback(async () => {
    if (!session) return;
    const progressed = await updateSessionProgress(session.sessionId, {
      timeExpired: true,
    });
    setSession(progressed);
    await saveSession(progressed);
    return progressed;
  }, [session]);

  const skipQuestion = useCallback(
    async (questionId: string) => {
      if (!session) return;
      const updated = await submitAnswerApi(session.sessionId, {
        questionId,
        answer: null,
        skipped: true,
        answeredAt: Date.now(),
      });
      setSession(updated);
      await saveSession(updated);
      return updated;
    },
    [session],
  );

  useEffect(() => {
    if (!session || session.status === "idle") return;
    saveSession(session);
  }, [session]);

  // Get current question from fetched questions array
  const currentQuestion = session
    ? questions[session.currentQuestionIndex]
    : null;
  const progressPercent = session
    ? (session.currentQuestionIndex / session.totalQuestions) * 100
    : 0;
  const isAnswered = (id: string) => (session ? id in session.answers : false);

  return {
    session:
      session ||
      buildInitialSession(patientId || "", caregiverId || "", questions.length),
    currentQuestion,
    progressPercent,
    isAnswered,
    isLoading,
    error,
    questions, // expose questions if needed
    startSession,
    submitAnswer,
    goToNext,
    goToPrev,
    markTimeExpired,
    skipQuestion,
  };
}
