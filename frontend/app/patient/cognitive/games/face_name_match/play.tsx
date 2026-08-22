import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, FaceNameMatchConfig, GameSessionResult } from '@/src/types/games.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  Easing,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Phase = 'instruction' | 'playing' | 'result';

export default function FaceNameMatchGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config } = usePersonalizedGameContent<FaceNameMatchConfig>(
    'face_name_match',
    difficulty,
    patientId,
  );

  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const shakeX = useSharedValue(0);

  const currentQuestion = config.questions[currentIndex];

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
        gameId: 'face_name_match',
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

  const handleSelect = (option: string) => {
    if (selectedOption || !currentQuestion) return;

    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      const nextScore = score + 1;
      setScore(nextScore);
      scoreRef.current = nextScore;
      setFeedback('correct');
      playSound('success');
      Speech.speak(`Yes, that's ${currentQuestion.correctAnswer}!`);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        goToNext(nextScore);
      }, 900);
    } else {
      setFeedback('incorrect');
      playSound('error');
      Speech.speak(`This is ${currentQuestion.correctAnswer}.`);
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

  const handleReset = () => {
    playSound('click');
    setPhase('instruction');
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setResult(null);
    setProgress(null);
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleGoBack = () => {
    playSound('back');
    router.back();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="face_name_match"
        difficulty={difficulty}
        steps={[
          { icon: '👪', text: `Look at ${config.questionCount} photos of people you know` },
          { icon: '👆', text: 'Tap the name that matches the person shown' },
          { icon: '⏱️', text: config.timeLimitSeconds ? `${config.timeLimitSeconds} seconds per photo` : 'No time limit — take your time' },
        ]}
        onStart={() => {
          playSound('click');
          setPhase('playing');
          setStartTime(Date.now());
          setCurrentIndex(0);
          setScore(0);
          scoreRef.current = 0;
          setSelectedOption(null);
          setFeedback(null);
        }}
        onBack={handleGoBack}
      />
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
        title="Who Is This?"
        difficulty={difficulty}
        timeLeft={config.timeLimitSeconds && !selectedOption ? timer.secondsLeft : null}
        totalSeconds={config.timeLimitSeconds}
        onBack={handleGoBack}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-700">
              Photo {currentIndex + 1} of {config.questions.length}
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
            entering={ZoomIn.duration(400).springify().damping(11)}
            style={{ alignItems: 'center', gap: 10 }}
          >
            {currentQuestion?.image ? (
              <Image
                source={{ uri: currentQuestion.image }}
                style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 4, borderColor: '#f3e8ff' }}
              />
            ) : (
              <View
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: '#faf5ff',
                  borderWidth: 2,
                  borderColor: '#e9d5ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 90 }}>{currentQuestion?.emoji}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={shakeStyle}>
            <Text className="text-2xl font-bold text-gray-900 text-center leading-snug">
              {currentQuestion?.relationLabel || 'Who is this?'}
            </Text>
          </Animated.View>

          <View className="gap-3">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrectOption = option === currentQuestion.correctAnswer;
              const showCorrectHighlight = selectedOption && isCorrectOption;
              const showWrongHighlight = isSelected && !isCorrectOption;

              return (
                <Animated.View key={option} entering={FadeInUp.delay(index * 60).duration(300)}>
                  <TouchableOpacity
                    onPress={() => handleSelect(option)}
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

          {feedback && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className={`p-3 rounded-xl items-center ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <Text className={`font-semibold ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                {feedback === 'correct' ? '✓ Correct!' : `✗ This is ${currentQuestion?.correctAnswer}`}
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
