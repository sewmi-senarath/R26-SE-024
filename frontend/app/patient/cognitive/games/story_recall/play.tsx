import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, StoryRecallConfig } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

type Phase = 'instruction' | 'reading' | 'delay' | 'quiz' | 'result';

// Forgiving comparison for typed answers: ignore case, surrounding space and a
// leading article, and accept a close containment either way.
function answersMatch(typed: string, correct: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/^(a|an|the)\s+/, '');
  const t = norm(typed);
  const c = norm(correct);
  if (!t) return false;
  return t === c || (t.length >= 3 && (c.includes(t) || t.includes(c)));
}

export default function StoryRecallGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading } = usePersonalizedGameContent<StoryRecallConfig>(
    'story_recall',
    difficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<StoryRecallConfig | null>(null);
  const config = frozenConfig ?? liveConfig;
  const questions = config.questions ?? [];

  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [delayLeft, setDelayLeft] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentQuestion = questions[currentIndex];

  const readStory = useCallback(() => {
    Speech.stop();
    Speech.speak(config.story, { rate: 0.92 });
  }, [config.story]);

  useEffect(() => {
    if (phase === 'reading') readStory();
  }, [phase, readStory]);

  // Delay/distraction gap before the questions (hard level).
  useEffect(() => {
    if (phase !== 'delay') return;
    if (delayLeft <= 0) {
      setPhase('quiz');
      return;
    }
    const t = setTimeout(() => setDelayLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, delayLeft]);

  const finishGame = useCallback(
    (finalScore: number) => {
      if (finalScore === questions.length) playSound('success');
      else if (finalScore === 0) playSound('error');
      else playSound('click');

      const nextResult: GameSessionResult = {
        gameId: 'story_recall',
        difficulty,
        score: finalScore,
        maxScore: questions.length,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: finalScore,
        totalAnswers: questions.length,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setShowConfetti(true);
      Speech.speak(`You answered ${finalScore} out of ${questions.length} correctly.`);
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('result');
      }, 1100);
    },
    [questions.length, difficulty, startTime, playSound, saveGameSession],
  );

  const advance = useCallback(
    (scoreNow: number) => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setTypedValue('');
        setFeedback(null);
      } else {
        finishGame(scoreNow);
      }
    },
    [currentIndex, questions.length, finishGame],
  );

  const evaluate = (answer: string) => {
    if (feedback || !currentQuestion) return;
    const normalized = answer.trim();
    if (!normalized) return;

    const isCorrect = currentQuestion.options
      ? normalized.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
      : answersMatch(normalized, currentQuestion.correctAnswer);

    setSelectedOption(currentQuestion.options ? normalized : null);
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) {
      setScore(nextScore);
      setFeedback('correct');
      playSound('success');
      Speech.speak('Correct!');
    } else {
      setFeedback('incorrect');
      playSound('error');
      Speech.speak(`The answer is ${currentQuestion.correctAnswer}.`);
    }
    setTimeout(() => advance(nextScore), 1200);
  };

  const handleSkip = () => {
    if (feedback) return;
    playSound('click');
    Speech.stop();
    advance(score);
  };

  const startReading = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setTypedValue('');
    setFeedback(null);
    setStartTime(Date.now());
    setPhase('reading');
  };

  const goToQuestions = () => {
    playSound('click');
    Speech.stop();
    if (config.delayMs > 0) {
      setDelayLeft(Math.round(config.delayMs / 1000));
      setPhase('delay');
    } else {
      setPhase('quiz');
    }
  };

  const handleReset = () => {
    playSound('click');
    Speech.stop();
    setFrozenConfig(null);
    setPhase('instruction');
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setTypedValue('');
    setFeedback(null);
    setResult(null);
    setProgress(null);
    setShowConfetti(false);
  };

  const handleGoBack = () => {
    playSound('back');
    Speech.stop();
    router.back();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="story_recall"
        difficulty={difficulty}
        steps={[
          { icon: '📖', text: 'Read the short story carefully (it is read aloud too)' },
          { icon: '🧠', text: 'Try to remember the details' },
          { icon: '❓', text: `Then answer ${config.questionCount} questions about it` },
          ...(config.delayMs > 0 ? [{ icon: '⏳', text: 'There is a short pause before the questions' }] : []),
        ]}
        onStart={startReading}
        onBack={handleGoBack}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your story…' : 'Start Game'}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} progress={progress} onPlayAgain={handleReset} onBack={handleGoBack} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={70} origin={{ x: -10, y: 0 }} fadeOut />}
      <GameHeader title="Story Recall" difficulty={difficulty} timeLeft={null} totalSeconds={null} onBack={handleGoBack} />

      {/* ── READING phase ───────────────────────────────────── */}
      {phase === 'reading' && (
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12 }}>
          <Text className="text-sm font-semibold text-cyan-600 uppercase tracking-widest text-center mb-3">
            Read this story
          </Text>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            <View className="bg-white rounded-3xl border border-cyan-100 p-6">
              <Text style={{ fontSize: 20, lineHeight: 32, color: '#1f2937' }}>{config.story}</Text>
            </View>
          </ScrollView>
          <View style={{ gap: 12, paddingVertical: 16 }}>
            <TouchableOpacity
              onPress={() => { playSound('click'); readStory(); }}
              activeOpacity={0.85}
              className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-cyan-200"
            >
              <Ionicons name="volume-high-outline" size={18} color="#0891B2" />
              <Text className="text-base font-bold text-cyan-700">Read aloud again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToQuestions}
              activeOpacity={0.85}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: '#06B6D4' }}
            >
              <Text className="text-base font-bold text-white">I&apos;m ready for the questions</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── DELAY phase ─────────────────────────────────────── */}
      {phase === 'delay' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 }}>
          <Animated.View entering={ZoomIn.duration(300)} className="w-28 h-28 rounded-full bg-cyan-100 items-center justify-center">
            <Text style={{ fontSize: 40, fontWeight: '800', color: '#0891B2' }}>{delayLeft}</Text>
          </Animated.View>
          <Text className="text-lg font-semibold text-gray-600 text-center">Take a short breath…</Text>
          <Text className="text-sm text-gray-400 text-center">The questions will start in a moment.</Text>
        </View>
      )}

      {/* ── QUIZ phase ──────────────────────────────────────── */}
      {phase === 'quiz' && currentQuestion && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-gray-700">
                Question {currentIndex + 1} of {questions.length}
              </Text>
              <Text className="text-sm font-bold text-cyan-600">{score} correct</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <View className="h-full bg-cyan-500 rounded-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center leading-snug mb-6">
              {currentQuestion.question}
            </Text>

            {currentQuestion.options ? (
              <View className="gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrectOption = option === currentQuestion.correctAnswer;
                  const showCorrect = feedback && isCorrectOption;
                  const showWrong = isSelected && !isCorrectOption;
                  return (
                    <Animated.View key={option} entering={FadeInUp.delay(index * 60).duration(300)}>
                      <TouchableOpacity
                        onPress={() => evaluate(option)}
                        disabled={Boolean(feedback)}
                        activeOpacity={0.85}
                        className={`py-5 px-6 rounded-2xl border-2 ${
                          showCorrect ? 'bg-green-50 border-green-400' : showWrong ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text className={`text-lg font-semibold text-center ${
                          showCorrect ? 'text-green-700' : showWrong ? 'text-red-700' : 'text-gray-800'
                        }`}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <View className="gap-3">
                <TextInput
                  value={typedValue}
                  onChangeText={setTypedValue}
                  editable={!feedback}
                  placeholder="Type your answer…"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  style={{ height: 58, backgroundColor: '#fff', borderWidth: 2, borderColor: feedback === 'correct' ? '#22C55E' : feedback === 'incorrect' ? '#EF4444' : '#e5e7eb', borderRadius: 16, paddingHorizontal: 16, fontSize: 18, color: '#111827' }}
                />
                <TouchableOpacity
                  onPress={() => evaluate(typedValue)}
                  disabled={Boolean(feedback) || typedValue.trim().length === 0}
                  activeOpacity={0.85}
                  className={`py-4 rounded-2xl items-center ${Boolean(feedback) || typedValue.trim().length === 0 ? 'bg-gray-200' : 'bg-cyan-500'}`}
                >
                  <Text className={`text-lg font-bold ${Boolean(feedback) || typedValue.trim().length === 0 ? 'text-gray-400' : 'text-white'}`}>
                    Submit
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!feedback && (
              <TouchableOpacity
                onPress={handleSkip}
                activeOpacity={0.7}
                className="mt-5 flex-row items-center justify-center gap-1.5 py-3"
                accessibilityRole="button"
                accessibilityLabel="Skip this question"
              >
                <Text className="text-base font-semibold text-gray-400">Skip</Text>
                <Ionicons name="play-skip-forward-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {feedback && (
              <Animated.View entering={FadeInUp.duration(300)} className={`mt-5 p-3 rounded-xl flex-row items-center justify-center gap-1.5 ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
                <Ionicons name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'} size={18} color={feedback === 'correct' ? '#15803D' : '#B91C1C'} />
                <Text className={`font-semibold ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                  {feedback === 'correct' ? 'Correct!' : `The answer is ${currentQuestion.correctAnswer}`}
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
