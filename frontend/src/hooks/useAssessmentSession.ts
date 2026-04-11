// session state manager
import { useState, useCallback, useRef, useEffect } from 'react';
import { MMSE_QUESTIONS, TOTAL_QUESTIONS, IMPAIRMENT_THRESHOLD } from '@/src/constants/questions';
import { MMSESession, SectionScores } from '@/src/types/assessment.types';
import { computeSectionScores, computeTotalScore, computeSeverity, buildScoringLog } from '../utils/scoring';
import 'react-native-get-random-values'; // needed for uuid
import { v4 as uuidv4 } from 'uuid';
import { saveSession } from '../utils/sessionStorage';

function buildInitialSession(patientId: string, caregiverId: string): MMSESession {
  return {
    currentQuestionIndex: 0,
    totalQuestions: TOTAL_QUESTIONS,
    status: 'idle',
    answers: {},
    answeredAt: {},
    timePerQuestion: {},
    attemptCount: {},
    skipped: [],
    registrationWords: ['Apple', 'Table', 'Penny'],
    sectionScores: { Orientation: 0, Registration: 0, Attention: 0, Recall: 0, Language: 0 },
    totalScore: 0,
    attentionMethod: 'serial7',
    adjustedScore: null,
    impairmentFlag: false,
    severity: 'none',
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
    locale: 'en-AU',
    administrationMode: 'assisted',
  };
}

export function useAssessmentSession(patientId: string, caregiverId: string) {
  const [session, setSession] = useState<MMSESession>(() =>
    buildInitialSession(patientId, caregiverId)
  );

  // Track time spent on current question
  const questionStartRef = useRef<number>(Date.now());

  const startSession = useCallback(() => {
    questionStartRef.current = Date.now();
    setSession(prev => ({
      ...prev,
      status: 'active',
      questionStartTime: Date.now(),
      timeLimit: MMSE_QUESTIONS[0].timeLimit ?? null,
    }));
  }, []);

  const submitAnswer = useCallback((questionId: string, answer: any) => {
    const timeSpent = Date.now() - questionStartRef.current;

    setSession(prev => {
      const newAnswers = { ...prev.answers, [questionId]: answer };
      const newAnsweredAt = { ...prev.answeredAt, [questionId]: Date.now() };
      const newTimePerQ = { ...prev.timePerQuestion, [questionId]: timeSpent };

      // Special flag: mark registration words as shown so recall is unlocked
      const recallWordsShown =
        prev.recallWordsShown || questionId === 'registration';

      // Special flag: track attention method used
      const serial7Attempted =
        prev.serial7Attempted || questionId === 'attention_serial7';

      // Recompute scores immediately after every answer
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
  }, []);

  const goToNext = useCallback(() => {
    setSession(prev => {
      const nextIndex = prev.currentQuestionIndex + 1;
      const isDone = nextIndex >= prev.totalQuestions;
      questionStartRef.current = Date.now();

      return {
        ...prev,
        currentQuestionIndex: isDone ? prev.currentQuestionIndex : nextIndex,
        status: isDone ? 'done' : 'active',
        completedAt: isDone ? new Date().toISOString() : null,
        questionStartTime: Date.now(),
        timeLimit: isDone ? null : (MMSE_QUESTIONS[nextIndex]?.timeLimit ?? null),
        timeExpired: false,
      };
    });
  }, []);

  const goToPrev = useCallback(() => {
    setSession(prev => {
      if (prev.currentQuestionIndex === 0) return prev;
      const prevIndex = prev.currentQuestionIndex - 1;
      questionStartRef.current = Date.now();
      return {
        ...prev,
        currentQuestionIndex: prevIndex,
        timeLimit: MMSE_QUESTIONS[prevIndex]?.timeLimit ?? null,
        timeExpired: false,
      };
    });
  }, []);

  const markTimeExpired = useCallback(() => {
    setSession(prev => ({ ...prev, timeExpired: true }));
  }, []);

  const skipQuestion = useCallback((questionId: string) => {
    setSession(prev => ({
      ...prev,
      skipped: [...prev.skipped, questionId],
    }));
  }, []);

  const currentQuestion = MMSE_QUESTIONS[session.currentQuestionIndex];
  const progressPercent = (session.currentQuestionIndex / session.totalQuestions) * 100;
  const isAnswered = (id: string) => id in session.answers;

  // Auto-persist every time session state changes
    useEffect(() => {
        if (session.status === 'idle') return; // don't save before test starts
        saveSession(session);
    }, [session]);

  return {
    session,
    currentQuestion,
    progressPercent,
    isAnswered,
    startSession,
    submitAnswer,
    goToNext,
    goToPrev,
    markTimeExpired,
    skipQuestion,
  };
}