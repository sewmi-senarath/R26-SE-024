import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { NumberWheel } from '@/src/components/patient/cognitive/components/games/shared/NumberWheel';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { CATEGORY_ICON_COLOR, getOrientationIcon } from '@/src/constants/orientationIcons';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, OrientationGameConfig } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Phase = 'instruction' | 'memorize' | 'playing' | 'result';

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  Time: { bg: 'bg-sky-50', text: 'text-sky-600' },
  Place: { bg: 'bg-green-50', text: 'text-green-600' },
  Festival: { bg: 'bg-amber-50', text: 'text-amber-600' },
  Calendar: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  Memory: { bg: 'bg-purple-50', text: 'text-purple-600' },
};

export default function OrientationGame() {
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading, refresh: refreshContent, difficulty } = usePersonalizedGameContent<OrientationGameConfig>(
    'orientation_game',
    routeDifficulty,
    patientId,
  );

  // Freeze the content for the duration of a round. Without this, a late
  // personalized response would swap the questions mid-game - which looked like
  // the items "reloading" a second or two after they first appeared.
  const [frozenConfig, setFrozenConfig] = useState<OrientationGameConfig | null>(null);
  const config = frozenConfig ?? liveConfig;

  // Difficulty-driven presentation knobs (all optional - sensible defaults keep
  // older content shapes working).
  const showCategory = config.showCategory !== false;
  const showHints = Boolean(config.showHints);
  const autoReadAloud = Boolean(config.autoReadAloud);
  const recallMode = config.answerMode === 'recall';
  const memoryAnchor = config.memoryAnchor ?? null;

  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wheelValue, setWheelValue] = useState<number | null>(null);
  const shakeX = useSharedValue(0);

  const currentQuestion = config.questions[currentIndex];
  const categoryStyle = CATEGORY_STYLE[currentQuestion?.category ?? 'Time'];
  // A spin-wheel recall answer only makes sense for numeric questions (spinning
  // to a word is impractical) - everything else stays multiple choice.
  const useWheelAnswer = recallMode && Boolean(currentQuestion?.numeric);
  // Range the wheel spins through: the question's own range, else derived from
  // its options with a little padding so the answer isn't the only edge value.
  const wheelRange = React.useMemo(() => {
    if (currentQuestion?.numericRange) return currentQuestion.numericRange;
    const nums = (currentQuestion?.options ?? []).map(Number).filter((n) => !Number.isNaN(n));
    if (!nums.length) return { min: 0, max: 9 };
    return { min: Math.min(...nums) - 2, max: Math.max(...nums) + 2 };
  }, [currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const finishGame = useCallback(
    (finalScore: number) => {
      if (finalScore === config.questions.length) {
        playSound('success');
      } else if (finalScore === 0) {
        playSound('error');
      } else {
        playSound('click');
      }

      const nextResult: GameSessionResult = {
        gameId: 'orientation_game',
        difficulty,
        score: finalScore,
        maxScore: config.questions.length,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: finalScore,
        totalAnswers: config.questions.length,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setPhase('result');
    },
    [config.questions.length, difficulty, playSound, saveGameSession, startTime],
  );

  const goToNext = useCallback(
    (finalScore: number) => {
      if (currentIndex < config.questions.length - 1) {
        playSound('click');
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setFeedback(null);
        setWheelValue(null);
        timer.reset();
      } else {
        finishGame(finalScore);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, config.questions.length, finishGame, playSound],
  );

  const scoreRef = React.useRef(score);
  React.useEffect(() => { scoreRef.current = score; }, [score]);

  const timer = useQuestionTimer({
    limitSeconds: phase === 'playing' ? config.timeLimitSeconds : null,
    onExpire: () => {
      if (!selectedOption) {
        playSound('error');
        setFeedback('incorrect');
        setTimeout(() => goToNext(scoreRef.current), 900);
      }
    },
    autoStart: phase === 'playing' && !selectedOption,
  });

  // Read the question aloud on easy, where extra support is intended.
  React.useEffect(() => {
    if (phase === 'playing' && autoReadAloud && currentQuestion?.question) {
      Speech.stop();
      Speech.speak(currentQuestion.question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, autoReadAloud]);

  // Speak the word to remember when the memorise card appears.
  React.useEffect(() => {
    if (phase === 'memorize' && memoryAnchor?.word) {
      Speech.stop();
      Speech.speak(`Please remember this word. ${memoryAnchor.word}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const evaluateAnswer = (answer: string) => {
    if (selectedOption || !currentQuestion) return;

    const normalized = answer.trim();
    if (!normalized) return;

    setSelectedOption(normalized);
    const isCorrect = normalized.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      const nextScore = score + 1;
      setScore(nextScore);
      scoreRef.current = nextScore;
      setFeedback('correct');
      playSound('success');
      Speech.speak('Correct!');
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        goToNext(nextScore);
      }, 900);
    } else {
      setFeedback('incorrect');
      playSound('error');
      Speech.speak(`Not quite. The answer is ${currentQuestion.correctAnswer}.`);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      setTimeout(() => goToNext(scoreRef.current), 1400);
    }
  };

  const handleSkip = () => {
    if (selectedOption || feedback) return;
    playSound('click');
    Speech.stop();
    goToNext(scoreRef.current);
  };

  const startPlaying = () => {
    setPhase('playing');
    setStartTime(Date.now());
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setSelectedOption(null);
    setFeedback(null);
    setWheelValue(null);
  };

  const handleStart = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    // Hard rounds show a word to memorise before the questions begin.
    if (frozen.memoryAnchor) {
      setPhase('memorize');
    } else {
      startPlaying();
    }
  };

  const handleReset = () => {
    playSound('click');
    refreshContent(progress?.difficulty);
    setFrozenConfig(null);
    setPhase('instruction');
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setResult(null);
    setProgress(null);
    setSelectedOption(null);
    setFeedback(null);
    setWheelValue(null);
  };

  const handleGoBack = () => {
    playSound('back');
    Speech.stop();
    router.back();
  };

  if (phase === 'instruction') {
    const steps = [
      { icon: '🧭', text: `Answer ${config.questionCount} questions about today, your home, and your festivals` },
      {
        icon: recallMode ? '🎡' : '👆',
        text: recallMode
          ? 'Tap an answer, or spin the wheel to your answer for number questions'
          : 'Tap the answer you think is correct',
      },
      {
        icon: '⏱️',
        text: config.timeLimitSeconds
          ? `${config.timeLimitSeconds} seconds per question`
          : 'No time limit - take your time',
      },
    ];
    if (memoryAnchor) {
      steps.push({ icon: '🧠', text: "First you'll get a word to remember - we ask for it at the end" });
    }

    return (
      <InstructionScreen
        gameId="orientation_game"
        difficulty={difficulty}
        steps={steps}
        onStart={handleStart}
        onBack={handleGoBack}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your game…' : 'Start Game'}
      />
    );
  }

  if (phase === 'memorize' && memoryAnchor) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <GameHeader
          title="Orientation Quiz"
          difficulty={difficulty}
          timeLeft={null}
          totalSeconds={null}
          onBack={handleGoBack}
        />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Animated.View entering={ZoomIn.duration(400)} style={{ alignItems: 'center', gap: 16 }}>
            <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center">
              <Ionicons name="bulb-outline" size={44} color="#7C3AED" />
            </View>
            <Text className="text-base font-semibold text-purple-600 uppercase tracking-widest">
              Remember this word
            </Text>
            <View className="bg-white rounded-3xl border-2 border-purple-200 px-10 py-8">
              <Text className="text-4xl font-extrabold text-gray-900 text-center tracking-wide">
                {memoryAnchor.word}
              </Text>
            </View>
            <Text className="text-base text-gray-500 text-center leading-relaxed px-4">
              Hold this word in your mind. We&apos;ll ask you for it again at the end of the quiz.
            </Text>
          </Animated.View>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: 28 }}>
          <TouchableOpacity
            onPress={() => {
              playSound('click');
              Speech.stop();
              startPlaying();
            }}
            activeOpacity={0.85}
            className="bg-purple-600 rounded-2xl py-5 items-center"
          >
            <Text className="text-white text-lg font-bold">I&apos;ll remember it</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'result' && result) {
    return (
      <GameResultScreen
        result={result}
        progress={progress}
        onPlayAgain={handleReset}
        onBack={handleGoBack}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={70} origin={{ x: -10, y: 0 }} fadeOut />}
      <GameHeader
        title="Orientation Quiz"
        difficulty={difficulty}
        timeLeft={config.timeLimitSeconds && !selectedOption ? timer.secondsLeft : null}
        totalSeconds={config.timeLimitSeconds}
        onBack={handleGoBack}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-700">
              Question {currentIndex + 1} of {config.questions.length}
            </Text>
            <Text className="text-sm font-bold text-blue-600">{score} correct</Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${((currentIndex + 1) / config.questions.length) * 100}%` }}
            />
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
          <Animated.View
            key={currentQuestion?.id}
            entering={ZoomIn.duration(400)}
            style={{ alignItems: 'center', gap: 10 }}
          >
            <View
              className={`w-28 h-28 rounded-full items-center justify-center ${categoryStyle?.bg ?? 'bg-sky-50'}`}
            >
              <Ionicons
                name={getOrientationIcon(currentQuestion)}
                size={52}
                color={CATEGORY_ICON_COLOR[currentQuestion?.category ?? 'Time'] ?? '#0284C7'}
              />
            </View>
            {showCategory && currentQuestion?.category ? (
              <Text className={`text-sm font-semibold ${categoryStyle?.text ?? 'text-sky-600'}`}>
                {currentQuestion.category}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View style={shakeStyle}>
            <Text className="text-2xl font-bold text-gray-900 text-center leading-snug">
              {currentQuestion?.question}
            </Text>
            {showHints && currentQuestion?.hint ? (
              <View className="flex-row items-center justify-center gap-1.5 mt-2 px-4">
                <Ionicons name="bulb-outline" size={14} color="#9CA3AF" />
                <Text className="text-sm text-gray-400 italic">
                  {currentQuestion.hint}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {useWheelAnswer ? (
            <View className="gap-4">
              <Text className="text-xs font-semibold text-gray-400 text-center uppercase tracking-widest">
                Spin to your answer
              </Text>
              <NumberWheel
                key={currentQuestion?.id}
                min={wheelRange.min}
                max={wheelRange.max}
                onChange={setWheelValue}
                disabled={Boolean(selectedOption)}
                state={feedback ?? 'neutral'}
              />
              <TouchableOpacity
                onPress={() => wheelValue != null && evaluateAnswer(String(wheelValue))}
                disabled={Boolean(selectedOption) || wheelValue == null}
                activeOpacity={0.85}
                className={`py-4 rounded-2xl items-center ${
                  Boolean(selectedOption) || wheelValue == null ? 'bg-gray-200' : 'bg-blue-600'
                }`}
              >
                <Text
                  className={`text-lg font-bold ${
                    Boolean(selectedOption) || wheelValue == null ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Submit Answer
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {currentQuestion?.options.map((option, index) => {
                const isSelected = selectedOption === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const showCorrectHighlight = selectedOption && isCorrectOption;
                const showWrongHighlight = isSelected && !isCorrectOption;

                return (
                  <Animated.View key={option} entering={FadeInUp.delay(index * 60).duration(300)}>
                    <TouchableOpacity
                      onPress={() => evaluateAnswer(option)}
                      disabled={Boolean(selectedOption)}
                      activeOpacity={0.8}
                      className={`py-5 px-6 rounded-2xl border-2 ${
                        showCorrectHighlight
                          ? 'bg-green-50 border-green-400'
                          : showWrongHighlight
                            ? 'bg-red-50 border-red-400'
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-lg font-semibold text-center ${
                          showCorrectHighlight
                            ? 'text-green-700'
                            : showWrongHighlight
                              ? 'text-red-700'
                              : 'text-gray-800'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {!selectedOption && !feedback && (
            <TouchableOpacity
              onPress={handleSkip}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-1.5 py-3"
              accessibilityRole="button"
              accessibilityLabel="Skip this question"
            >
              <Text className="text-base font-semibold text-gray-400">Skip</Text>
              <Ionicons name="play-skip-forward-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {feedback && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className={`p-3 rounded-xl flex-row items-center justify-center gap-1.5 ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <Ionicons
                name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={feedback === 'correct' ? '#15803D' : '#B91C1C'}
              />
              <Text className={`font-semibold ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                {feedback === 'correct' ? 'Correct!' : `The answer is ${currentQuestion?.correctAnswer}`}
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
