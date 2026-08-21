import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, WordPuzzleConfig } from '@/src/types/games.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Phase = 'instruction' | 'playing' | 'result';

export default function WordPuzzleGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config } = usePersonalizedGameContent<WordPuzzleConfig>(
    'word_puzzle',
    difficulty,
    patientId,
  );
  
  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (feedback === 'incorrect') {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [feedback]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const timer = useQuestionTimer({
    limitSeconds: revealedAnswer ? null : (config.timeLimitSeconds || null),
    onExpire: () => handleNextWord(score),
    autoStart: phase === 'playing' && !revealedAnswer,
  });

  const currentWord = config.words[currentWordIndex];
  const scrambledWord = useMemo(
    () => (currentWord ? scrambleWord(currentWord.word) : ''),
    [currentWord?.id, currentWord?.word],
  );
  const visualCue = currentWord ? getWordVisualCue(currentWord.word, currentWord.category) : '💡';
  const extraHints = currentWord ? buildExtraHints(currentWord.word, currentWord.category) : [];
  const visibleHints = extraHints.slice(0, hintLevel);
  const canShowMoreHints = hintLevel < extraHints.length;

  const handleSubmit = () => {
    if (!currentWord || revealedAnswer) return;

    const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z]/g, '');
    const target = normalize(currentWord.word);
    const answer = normalize(userAnswer);
    const isCorrect = answer === target || levenshtein(answer, target) <= 1;

    if (isCorrect) {
      const nextScore = score + 1;
      playSound('success');
      setScore(nextScore);
      setFeedback('correct');
      Speech.speak('Correct! Well done.');
      setShowConfetti(true);

      setTimeout(() => {
        setShowConfetti(false);
        handleNextWord(nextScore);
      }, 900);
    } else {
      playSound('error');
      setFeedback('incorrect');
      setHintLevel(level => Math.min(level + 1, extraHints.length));
      Speech.speak('Try again. Take your time.');
    }
  };

  const handleNextWord = useCallback((nextScore = score) => {
    if (currentWordIndex < config.words.length - 1) {
      playSound('click');
      setCurrentWordIndex(i => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setHintLevel(0);
      setRevealedAnswer(false);
      timer.reset();
    } else {
      finishGame(nextScore);
    }
  }, [currentWordIndex, config.words.length, timer, playSound, score]);

  const handleShowMoreHint = () => {
    if (!currentWord || !canShowMoreHints) return;

    playSound('click');
    setHintLevel(level => Math.min(level + 1, extraHints.length));
  };

  const handleRevealAnswer = () => {
    if (!currentWord) return;

    playSound('click');
    setRevealedAnswer(true);
    setFeedback(null);
    setUserAnswer(currentWord.word);
    Speech.speak(`The answer is ${currentWord.word}.`);
  };

  const handleSkipWord = () => {
    playSound('click');
    handleNextWord(score);
  };

  const finishGame = (finalScore = score) => {
    if (finalScore === config.words.length) {
      playSound('success');
    } else if (finalScore === 0) {
      playSound('error');
    } else {
      playSound('click');
    }
    
    const nextResult: GameSessionResult = {
      gameId: 'word_puzzle',
      difficulty,
      score: finalScore,
      maxScore: config.words.length,
      timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
      completedAt: new Date().toISOString(),
      correctAnswers: finalScore,
      totalAnswers: config.words.length,
    };
    setResult(nextResult);
    saveGameSession(nextResult).then(setProgress);
    setPhase('result');
  };

  const handleReset = () => {
    playSound('click');
    setPhase('instruction');
    setCurrentWordIndex(0);
    setUserAnswer('');
    setScore(0);
    setResult(null);
    setProgress(null);
    setFeedback(null);
    setHintLevel(0);
    setRevealedAnswer(false);
  };

  const handleGoBack = () => {
    playSound('back');
    router.back();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="word_puzzle"
        difficulty={difficulty}
        steps={[
          { icon: '🔤', text: `Unscramble ${config.wordLength}-letter words` },
          { icon: '🔀', text: config.scrambled ? 'Use the scrambled letters, visual clue, and hints' : 'Use the visual clue and hints to type the word' },
          { icon: '💡', text: 'Ask for extra hints when you need help' },
          { icon: '✅', text: 'Reveal the answer or skip any word without losing your progress' },
          { icon: '⏱️', text: config.timeLimitSeconds ? `${config.timeLimitSeconds} seconds per word` : 'No time limit' },
          
        ]}
        onStart={() => {
          playSound('click');
          setPhase('playing');
          setStartTime(Date.now());
          setCurrentWordIndex(0);
          setUserAnswer('');
          setFeedback(null);
          setHintLevel(0);
          setRevealedAnswer(false);
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
        title="Word Puzzle"
        difficulty={difficulty}
        timeLeft={config.timeLimitSeconds && !revealedAnswer ? timer.secondsLeft : null}
        totalSeconds={config.timeLimitSeconds}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-700">
              Word {currentWordIndex + 1} of {config.words.length}
            </Text>
            <Text className="text-sm font-bold text-blue-600">{score} correct</Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${((currentWordIndex + 1) / config.words.length) * 100}%`,
              }}
            />
          </View>
        </View>

        {/* Timer bar if time limit */}
        {config.timeLimitSeconds && !revealedAnswer && (
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-8">
            <View
              className={`h-full rounded-full ${timer.isWarning ? 'bg-red-400' : 'bg-blue-400'}`}
              style={{ width: `${100 - timer.progressPercent}%` }}
            />
          </View>
        )}

        {/* Main content */}
        <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            {currentWord?.image ? (
              <Image source={{ uri: currentWord.image }} style={{ width: 170, height: 126, borderRadius: 18 }} />
            ) : (
              <Animated.View
                key={currentWord?.id}
                entering={ZoomIn.duration(400).springify().damping(11)}
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 66,
                  backgroundColor: '#eef2ff',
                  borderWidth: 2,
                  borderColor: '#c7d2fe',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 64 }}>{visualCue}</Text>
              </Animated.View>
            )}
            {currentWord?.category && (
              <Text className="text-sm font-semibold text-indigo-600">
                {currentWord.category}
              </Text>
            )}
          </View>

          {/* Hint */}
          {currentWord?.hint && (
            <View className="bg-blue-50 rounded-2xl p-4">
              <Text className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                Hint
              </Text>
              <Text className="text-base text-blue-900 font-medium">{currentWord.hint}</Text>
            </View>
          )}

          {visibleHints.length > 0 && (
            <View className="gap-2">
              {visibleHints.map((hint, index) => (
                <View key={hint} className="bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
                  <Text className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">
                    Extra hint {index + 1}
                  </Text>
                  <Text className="text-base text-amber-900 font-medium">{hint}</Text>
                </View>
              ))}
            </View>
          )}

          {revealedAnswer && currentWord && (
            <View className="bg-gray-900 rounded-2xl p-4 items-center">
              <Text className="text-xs text-gray-300 font-semibold uppercase tracking-wide mb-1">
                Answer
              </Text>
              <Text className="text-3xl text-white font-bold tracking-widest">
                {currentWord.word}
              </Text>
            </View>
          )}

          {/* Scrambled/hint display */}
          {config.scrambled ? (
            <View className="items-center gap-4">
              <Text className="text-xs text-gray-400 uppercase tracking-wide">Unscramble these letters</Text>
              <View className="flex-row flex-wrap justify-center gap-3">
                {scrambledWord.split('').map((letter, i) => (
                  <Animated.View
                    key={`${currentWord?.id}-${i}`}
                    entering={ZoomIn.delay(i * 60).duration(350).springify().damping(12)}
                    // increased size for easier tapping/reading
                    style={{ width: 72, height: 72, backgroundColor: '#fff', borderRadius: 18, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f2937' }}>{letter}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          ) : (
            <View className="items-center gap-2">
              <Text className="text-xs text-gray-400 uppercase tracking-wide">Type the word</Text>
              {config.showLetterHints && currentWord && (
                <Text className="text-xl font-semibold text-gray-600">
                  {maskWord(currentWord.word)}
                </Text>
              )}
            </View>
          )}

          {/* Input field */}
          <View className="gap-2">
            <Animated.View style={shakeStyle}>
              <TextInput
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Type your answer..."
                placeholderTextColor="#9ca3af"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                // keep editable unless the user already got it correct
                editable={feedback !== 'correct' && !revealedAnswer}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={config.wordLength + 4}
                style={{
                  height: 72,
                  backgroundColor: '#ffffff',
                  borderWidth: 2,
                  borderColor:
                    feedback === 'correct'
                      ? '#10b981'
                      : feedback === 'incorrect'
                        ? '#ef4444'
                        : '#e5e7eb',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#1f2937',
                }}
              />
            </Animated.View>

            {/* Feedback */}
            {feedback && (
              <View
                className={`p-3 rounded-xl items-center ${
                  feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    feedback === 'correct' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {feedback === 'correct'
                    ? '✓ Correct!'
                    : '✗ Wrong — try again'}
                </Text>
              </View>
            )}
          </View>

          {revealedAnswer ? (
            <TouchableOpacity
              onPress={() => handleNextWord(score)}
              className="py-4 rounded-2xl items-center bg-blue-500"
            >
              <Text className="font-bold text-base text-white">
                {currentWordIndex === config.words.length - 1 ? 'Finish' : 'Continue'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              // allow retry when incorrect; only disable after correct or if input is empty
              disabled={!userAnswer.trim() || feedback === 'correct'}
              className={`py-4 rounded-2xl items-center ${
                userAnswer.trim() && feedback !== 'correct' ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  userAnswer.trim() && feedback !== 'correct' ? 'text-white' : 'text-gray-400'
                }`}
              >
                {currentWordIndex === config.words.length - 1 ? 'Finish' : 'Submit'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={handleShowMoreHint}
              disabled={!canShowMoreHints || revealedAnswer}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                backgroundColor: canShowMoreHints && !revealedAnswer ? '#fef3c7' : '#f3f4f6',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: canShowMoreHints && !revealedAnswer ? '#92400e' : '#9ca3af',
                }}
              >
                More hint
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRevealAnswer}
              disabled={revealedAnswer}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                backgroundColor: revealedAnswer ? '#f3f4f6' : '#e0e7ff',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: revealedAnswer ? '#9ca3af' : '#4338ca',
                }}
              >
                Reveal answer
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSkipWord}
            className="items-center"
          >
            <Text className="text-sm font-semibold text-gray-500">
              Skip this word
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to scramble word
function scrambleWord(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

function maskWord(word: string): string {
  if (word.length <= 2) return word.split('').join(' ');
  const middle = word.slice(1, -1).split('').map(() => '_').join(' ');
  return `${word[0]} ${middle} ${word[word.length - 1]}`;
}

function buildExtraHints(word: string, category: string): string[] {
  return [
    `It starts with ${word[0]} and ends with ${word[word.length - 1]}.`,
    `It has ${word.length} letters.`,
    `Letter pattern: ${buildLetterPattern(word)}.`,
    `Category: ${category}.`,
  ];
}

function buildLetterPattern(word: string): string {
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  return word
    .toUpperCase()
    .split('')
    .map(letter => (vowels.has(letter) ? 'V' : 'C'))
    .join(' ');
}

function getWordVisualCue(word: string, category: string): string {
  const byWord: Record<string, string> = {
    AIRPLANE: '✈️',
    APPLE: '🍎',
    BAG: '👜',
    BANANA: '🍌',
    BAT: '🏏',
    BEACH: '🏖️',
    BED: '🛏️',
    BEE: '🐝',
    BOOK: '📖',
    BREAD: '🍞',
    BUS: '🚌',
    BUTTERFLY: '🦋',
    CAKE: '🍰',
    CALENDAR: '📅',
    CAMERA: '📷',
    CAR: '🚗',
    CAT: '🐱',
    CHAIR: '🪑',
    CLOCK: '🕒',
    CLOUD: '☁️',
    COW: '🐄',
    CUP: '☕',
    DOG: '🐶',
    ELEPHANT: '🐘',
    EYE: '👁️',
    FOX: '🦊',
    GIFT: '🎁',
    GRAPES: '🍇',
    GUITAR: '🎸',
    HAT: '🎩',
    HEART: '❤️',
    HOSPITAL: '🏥',
    HOUSE: '🏠',
    KEY: '🔑',
    KEYBOARD: '⌨️',
    LAPTOP: '💻',
    MEDICINE: '💊',
    MOON: '🌙',
    MOUNTAIN: '⛰️',
    MUSIC: '🎵',
    OCEAN: '🌊',
    OWL: '🦉',
    PEN: '🖊️',
    PHONE: '📱',
    PIE: '🥧',
    PIZZA: '🍕',
    PLANT: '🪴',
    RIVER: '🏞️',
    SANDWICH: '🥪',
    SHIP: '🚢',
    SHOES: '👞',
    STAR: '⭐',
    SUN: '☀️',
    TABLE: '🍽️',
    TEA: '🍵',
    TRAIN: '🚆',
    UMBRELLA: '☂️',
    WATCH: '⌚',
    WATER: '💧',
  };

  const byCategory: Record<string, string> = {
    Action: '🏃',
    Adjective: '✨',
    Age: '🎂',
    Animals: '🐾',
    Art: '🎨',
    Body: '🧍',
    Clothing: '👕',
    Education: '📚',
    Emotion: '😊',
    Events: '🎉',
    Finance: '💳',
    Food: '🍽️',
    Furniture: '🪑',
    Games: '🎲',
    Health: '🩺',
    Nature: '🌿',
    Objects: '📦',
    People: '👤',
    Places: '📍',
    Science: '🔬',
    Senses: '👂',
    Shape: '⭕',
    Technology: '💻',
    Time: '🕒',
    Tools: '🛠️',
    Transport: '🚗',
    Travel: '🧳',
  };

  return byWord[word.toUpperCase()] || byCategory[category] || '💡';
}

// Tiny helper (can be moved out)
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}
