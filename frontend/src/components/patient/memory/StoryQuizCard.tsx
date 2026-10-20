// ─────────────────────────────────────────────────────────────────────────
//  Post-story recall quiz — shown right after a patient finishes listening
//  to a family-created memory story (wired in via EmotionTracker's
//  onSessionEnd). Renders nothing if the AI couldn't generate a quiz for
//  this story; see backend/src/services/family/storyQuizService.js for why
//  that's the honest fallback here instead of a weak template question.
// ─────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStoredRole } from '../../../api/authApi';
import {
  generateStoryQuiz as generateStoryQuizFamily,
  answerStoryQuizQuestion as answerStoryQuizQuestionFamily,
  StoryQuizAttempt,
} from '../../../services/family/storyQuizService';
import {
  generateStoryQuiz as generateStoryQuizPatient,
  answerStoryQuizQuestion as answerStoryQuizQuestionPatient,
} from '../../../services/patient/storyQuizService';

// same per-call role dispatch EmotionTracker.getEmotionService() uses —
// each role's JWT is only accepted by that role's own routes
async function getQuizService() {
  const role = await getStoredRole();
  return role === 'patient'
    ? { generateStoryQuiz: generateStoryQuizPatient, answerStoryQuizQuestion: answerStoryQuizQuestionPatient }
    : { generateStoryQuiz: generateStoryQuizFamily, answerStoryQuizQuestion: answerStoryQuizQuestionFamily };
}

interface StoryQuizCardProps {
  memoryId: string;
  sessionId: string;
  storyText: string; // full generatedStory — fallback for "re-read this part" when a question has no sourceSnippet
  onDismiss: () => void;
}

type AnswerFeedback = {
  isCorrect: boolean;
  sourceSnippet: string;
  quizComplete: boolean;
  score: number | null;
};

export default function StoryQuizCard({ memoryId, sessionId, storyText, onDismiss }: StoryQuizCardProps) {
  const [quiz, setQuiz] = useState<StoryQuizAttempt | null | 'loading'>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { generateStoryQuiz } = await getQuizService();
      const result = await generateStoryQuiz(memoryId, sessionId);
      if (cancelled) return;
      if (!result) {
        onDismiss();
        return;
      }
      setQuiz(result);
      // resume mid-quiz if this attempt already has some answers (e.g. the
      // generate call hit the idempotency guard after a double-fire)
      const firstUnanswered = result.questions.findIndex((q) => q.selectedOptionIndex === null);
      setCurrentIndex(firstUnanswered === -1 ? result.questions.length : firstUnanswered);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
    return () => { cancelled = true; };
  }, [memoryId, sessionId]);

  if (quiz === 'loading') {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#7C3AED" />
        <Text style={styles.loadingText}>Preparing a little memory game for you...</Text>
      </View>
    );
  }
  if (!quiz) return null;

  const handleSelect = async (optionIndex: number) => {
    if (submitting) return;
    setSubmitting(true);
    const { answerStoryQuizQuestion } = await getQuizService();
    const result = await answerStoryQuizQuestion(quiz.attemptId, currentIndex, optionIndex);
    setSubmitting(false);
    if (!result) return;

    setFeedback({
      isCorrect: result.isCorrect,
      sourceSnippet: result.sourceSnippet,
      quizComplete: result.quizComplete,
      score: result.score,
    });
  };

  const handleContinue = () => {
    setFeedback(null);
    setCurrentIndex((i) => i + 1);
  };

  // --- final score screen ---
  if (feedback?.quizComplete) {
    return (
      <View style={styles.card}>
        <Ionicons name="sparkles" size={32} color="#7C3AED" />
        <Text style={styles.completeTitle}>You remembered {feedback.score} of {quiz.totalQuestions}!</Text>
        <Text style={styles.completeSubtitle}>Thank you for playing along.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onDismiss} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- "let's remember together" remediation after a wrong answer ---
  if (feedback && !feedback.isCorrect) {
    return (
      <View style={styles.card}>
        <Ionicons name="book" size={28} color="#7C3AED" />
        <Text style={styles.remediationTitle}>Let's remember together</Text>
        <View style={styles.snippetBox}>
          <Text style={styles.snippetText}>
            {feedback.sourceSnippet || storyText}
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- brief affirmation after a correct answer ---
  if (feedback?.isCorrect) {
    return (
      <View style={styles.card}>
        <Ionicons name="heart" size={28} color="#16A34A" />
        <Text style={styles.correctText}>That's right!</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- current question ---
  const question = quiz.questions[currentIndex];
  if (!question) return null; // shouldn't happen — quizComplete covers the "all answered" case

  return (
    <View style={styles.card}>
      <Text style={styles.progressText}>Question {currentIndex + 1} of {quiz.totalQuestions}</Text>
      <Text style={styles.questionText}>{question.questionText}</Text>
      {question.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.optionBtn}
          onPress={() => handleSelect(index)}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    alignItems: 'center', gap: 10, paddingVertical: 24,
    backgroundColor: '#FAF5FF', borderRadius: 18, borderWidth: 1, borderColor: '#E9D5FF',
  },
  loadingText: { color: '#6B21A8', fontSize: 14, fontWeight: '600' },

  card: {
    backgroundColor: '#FAF5FF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E9D5FF', alignItems: 'center', gap: 10,
  },
  progressText: { fontSize: 13, fontWeight: '700', color: '#7C3AED', alignSelf: 'flex-start' },
  questionText: { fontSize: 18, fontWeight: '800', color: '#1C1917', lineHeight: 25, alignSelf: 'flex-start', marginBottom: 6 },

  optionBtn: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#E9D5FF',
  },
  optionText: { fontSize: 16, fontWeight: '700', color: '#3B0764', textAlign: 'center' },

  correctText: { fontSize: 18, fontWeight: '800', color: '#16A34A' },
  remediationTitle: { fontSize: 18, fontWeight: '800', color: '#1C1917' },
  snippetBox: { width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E9D5FF' },
  snippetText: { fontSize: 15, fontWeight: '600', color: '#3B0764', lineHeight: 22 },

  completeTitle: { fontSize: 19, fontWeight: '800', color: '#1C1917', textAlign: 'center' },
  completeSubtitle: { fontSize: 14, color: '#78716C', fontWeight: '600' },

  primaryBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
