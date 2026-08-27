import { FamilyAlbum } from '@/src/components/patient/cognitive/components/games/shared/FamilyAlbum';
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
import React, { useCallback, useMemo, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Phase = 'instruction' | 'album' | 'study' | 'playing' | 'result';

export default function FaceNameMatchGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading } = usePersonalizedGameContent<FaceNameMatchConfig>(
    'face_name_match',
    difficulty,
    patientId,
  );

  // Freeze the content for the duration of a round. Without this, a late
  // personalized response would swap the people mid-game — which looked like the
  // items "reloading" a second or two after they first appeared.
  const [frozenConfig, setFrozenConfig] = useState<FaceNameMatchConfig | null>(null);
  const config = frozenConfig ?? liveConfig;

  const recallMode = config.answerMode === 'recall';
  const studyPhase = Boolean(config.studyPhase);
  const firstLetterCue = Boolean(config.firstLetterCue);

  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealed, setRevealed] = useState(false); // free-recall: name shown for self-check
  const [showHint, setShowHint] = useState(false); // errorless first-letter cue
  const shakeX = useSharedValue(0);
  const hintTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = config.questions[currentIndex];

  const albumPeople = useMemo(
    () =>
      config.questions.map((q) => ({
        name: q.correctAnswer,
        emoji: q.emoji,
        image: q.image,
        relation: q.relation,
      })),
    [config.questions],
  );

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const clearHintTimer = () => {
    if (hintTimer.current) {
      clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
  };

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
      clearHintTimer();
      if (currentIndex < config.questions.length - 1) {
        playSound('click');
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setFeedback(null);
        setRevealed(false);
        setShowHint(false);
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
    limitSeconds: phase === 'playing' && !revealed ? config.timeLimitSeconds : null,
    onExpire: () => {
      if (selectedOption) return;
      if (recallMode) {
        // Time's up to remember — reveal the name so they can self-check.
        setRevealed(true);
        playSound('click');
        return;
      }
      playSound('error');
      setFeedback('incorrect');
      setTimeout(() => goToNext(scoreRef.current), 900);
    },
    autoStart: phase === 'playing' && !selectedOption && !revealed,
  });

  // Errorless first-letter cue: if an easy question sits unanswered, gently
  // fade in the first letter so the patient is guided to success.
  React.useEffect(() => {
    clearHintTimer();
    if (phase === 'playing' && firstLetterCue && !selectedOption && currentQuestion) {
      hintTimer.current = setTimeout(() => setShowHint(true), 4500);
    }
    return clearHintTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, firstLetterCue, selectedOption]);

  const resolve = (remembered: boolean) => {
    if (remembered) {
      const nextScore = score + 1;
      setScore(nextScore);
      scoreRef.current = nextScore;
      setFeedback('correct');
      playSound('success');
      Speech.speak(`Wonderful, that's ${currentQuestion?.correctAnswer}!`);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        goToNext(nextScore);
      }, 900);
    } else {
      setFeedback('incorrect');
      playSound('error');
      Speech.speak(`This is ${currentQuestion?.correctAnswer}.`);
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

  const handleSelect = (option: string) => {
    if (selectedOption || !currentQuestion) return;
    clearHintTimer();
    setSelectedOption(option);
    resolve(option === currentQuestion.correctAnswer);
  };

  // Free-recall self-check (hard): patient reports whether they remembered.
  const handleSelfCheck = (remembered: boolean) => {
    if (selectedOption || !currentQuestion) return;
    setSelectedOption(currentQuestion.correctAnswer);
    resolve(remembered);
  };

  const startPlaying = () => {
    setPhase('playing');
    setStartTime(Date.now());
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setSelectedOption(null);
    setFeedback(null);
    setRevealed(false);
    setShowHint(false);
  };

  const handleStart = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    if (frozen.studyPhase) {
      setPhase('study');
    } else {
      startPlaying();
    }
  };

  const openAlbum = () => {
    playSound('click');
    setFrozenConfig(liveConfig);
    setPhase('album');
  };

  const leaveAlbum = () => {
    Speech.stop();
    setFrozenConfig(null);
    setPhase('instruction');
  };

  const handleReset = () => {
    playSound('click');
    clearHintTimer();
    setFrozenConfig(null);
    setPhase('instruction');
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setResult(null);
    setProgress(null);
    setSelectedOption(null);
    setFeedback(null);
    setRevealed(false);
    setShowHint(false);
  };

  const handleGoBack = () => {
    playSound('back');
    Speech.stop();
    router.back();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="face_name_match"
        difficulty={difficulty}
        steps={[
          { icon: '👪', text: `Look at ${config.questionCount} photos of people you know` },
          {
            icon: recallMode ? '💭' : '👆',
            text: recallMode
              ? 'Try to remember their name, then check if you got it right'
              : 'Tap the name that matches the person shown',
          },
          studyPhase
            ? { icon: '📖', text: 'First, look through the Family Album to refresh your memory' }
            : { icon: '⏱️', text: config.timeLimitSeconds ? `${config.timeLimitSeconds} seconds per photo` : 'No time limit — take your time' },
        ]}
        secondaryAction={{ label: 'Open Family Album', icon: 'book', onPress: openAlbum }}
        onStart={handleStart}
        onBack={handleGoBack}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your game…' : studyPhase ? 'Study & Play' : 'Start Game'}
      />
    );
  }

  if (phase === 'album' || phase === 'study') {
    const isStudy = phase === 'study';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <GameHeader
          title={isStudy ? 'Family Album — Study' : 'Family Album'}
          difficulty={difficulty}
          timeLeft={null}
          totalSeconds={null}
          onBack={leaveAlbum}
        />
        <FamilyAlbum
          people={albumPeople}
          mode={isStudy ? 'study' : 'browse'}
          doneLabel={isStudy ? "I'm ready — start" : 'Done'}
          onDone={() => {
            if (isStudy) {
              startPlaying();
            } else {
              leaveAlbum();
            }
          }}
        />
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

  const firstLetter = currentQuestion?.correctAnswer?.charAt(0)?.toUpperCase() ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={70} origin={{ x: -10, y: 0 }} fadeOut />}
      <GameHeader
        title="Who Is This?"
        difficulty={difficulty}
        timeLeft={config.timeLimitSeconds && !selectedOption && !revealed ? timer.secondsLeft : null}
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
            entering={ZoomIn.duration(400)}
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

          {recallMode ? (
            // ── Free recall: try to remember, reveal, then self-check ──
            !revealed ? (
              <View className="gap-3 items-center">
                <Text className="text-base text-gray-500 text-center">
                  Take a moment and try to remember their name.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    timer.stop();
                    setRevealed(true);
                    playSound('click');
                  }}
                  activeOpacity={0.85}
                  className="py-4 px-8 rounded-2xl items-center bg-purple-600"
                >
                  <Text className="text-white text-lg font-bold">Show me the name</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-4">
                <View className="items-center">
                  <Text className="text-sm text-gray-400">Their name is</Text>
                  <Text className="text-3xl font-extrabold text-gray-900 mt-1">
                    {currentQuestion?.correctAnswer}
                  </Text>
                </View>
                {!selectedOption ? (
                  <>
                    <Text className="text-base text-gray-600 text-center">Did you remember it?</Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => handleSelfCheck(false)}
                        activeOpacity={0.85}
                        className="flex-1 py-5 rounded-2xl items-center border-2 border-gray-200 bg-white"
                      >
                        <Text className="text-gray-700 text-lg font-bold">Not this time</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSelfCheck(true)}
                        activeOpacity={0.85}
                        className="flex-1 py-5 rounded-2xl items-center bg-green-500"
                      >
                        <Text className="text-white text-lg font-bold">Yes, I did!</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            )
          ) : (
            // ── Recognition: pick the name ──
            <>
              <View className="gap-3">
                {currentQuestion?.options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrectOption = option === currentQuestion.correctAnswer;
                  const showCorrectHighlight = selectedOption && isCorrectOption;
                  const showWrongHighlight = isSelected && !isCorrectOption;
                  const cued = showHint && !selectedOption && isCorrectOption;

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
                              : cued
                                ? 'bg-amber-50 border-amber-300'
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

              {showHint && !selectedOption ? (
                <Animated.View entering={FadeInUp.duration(300)} className="items-center">
                  <Text className="text-sm text-amber-600 font-semibold">
                    💡 Their name starts with “{firstLetter}”
                  </Text>
                </Animated.View>
              ) : null}
            </>
          )}

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
