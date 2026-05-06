import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { getGameContent } from '@/src/constants/gameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { Difficulty, GameSessionResult, WordPuzzleConfig } from '@/src/types/games.types';
import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

type Phase = 'instruction' | 'playing' | 'result';

export default function WordPuzzleGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const config = getGameContent<WordPuzzleConfig>('word_puzzle', difficulty);
  
  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // allow caregiver/player to toggle timer (relaxed pacing)
  const [timerEnabled, setTimerEnabled] = useState(true);
  const timer = useQuestionTimer({
    limitSeconds: timerEnabled ? (config.timeLimitSeconds || null) : null,
    onExpire: () => handleNextWord(false),
    autoStart: phase === 'playing' && timerEnabled,
  });
  
  const [showConfetti, setShowConfetti] = useState(false);

  const currentWord = config.words[currentWordIndex];
  const scrambledWord = currentWord ? scrambleWord(currentWord.word) : '';

  const handleSubmit = () => {
    const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z]/g, '');
    const target = normalize(currentWord.word);
    const answer = normalize(userAnswer);
    const isCorrect = answer === target || levenshtein(answer, target) <= 1; // forgiving

    if (isCorrect) {
      // positive reinforcement: score, feedback, spoken confirmation, confetti, then auto-advance
      setScore(s => s + 1);
      setFeedback('correct');
      Speech.speak('Correct! Well done.');
      setShowConfetti(true);

      setTimeout(() => {
        setShowConfetti(false);
        handleNextWord(true);
      }, 900);
    } else {
      // allow multiple attempts, spoken gentle hint
      setFeedback('incorrect');
      Speech.speak('Try again. Take your time.');
      // do not auto-advance — let user retry
    }
  };

  const handleNextWord = useCallback((wasCorrect: boolean) => {
    if (currentWordIndex < config.words.length - 1) {
      setCurrentWordIndex(i => i + 1);
      setUserAnswer('');
      setFeedback(null);
      timer.reset();
    } else {
      finishGame();
    }
  }, [currentWordIndex, config.words.length, timer]);

  const finishGame = () => {
    setResult({
      gameId: 'word_puzzle',
      difficulty,
      score,
      maxScore: config.words.length,
      timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
      completedAt: new Date().toISOString(),
      correctAnswers: score,
      totalAnswers: config.words.length,
    });
    setPhase('result');
  };

  const handleReset = () => {
    setPhase('instruction');
    setCurrentWordIndex(0);
    setUserAnswer('');
    setScore(0);
    setResult(null);
    setFeedback(null);
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="word_puzzle"
        difficulty={difficulty}
        steps={[
          { icon: '🔤', text: `Unscramble ${config.wordLength}-letter words` },
          { icon: '💡', text: config.showLetterHints ? 'Letter position hints are shown' : 'No hints - rely on memory' },
          { icon: '⏱️', text: config.timeLimitSeconds ? `${config.timeLimitSeconds} seconds per word` : 'No time limit' },
          { icon: '🔀', text: config.scrambled ? 'Letters are scrambled — rearrange them' : 'Type the word from the hint' },
        ]}
        onStart={() => {
          setPhase('playing');
          setStartTime(Date.now());
          setCurrentWordIndex(0);
        }}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} onPlayAgain={handleReset} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={70} origin={{ x: -10, y: 0 }} fadeOut />}
      <GameHeader
        title="Word Puzzle"
        difficulty={difficulty}
        timeLeft={config.timeLimitSeconds ? timer.secondsLeft : null}
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
        {config.timeLimitSeconds && (
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-8">
            <View
              className={`h-full rounded-full ${timer.isWarning ? 'bg-red-400' : 'bg-blue-400'}`}
              style={{ width: `${100 - timer.progressPercent}%` }}
            />
          </View>
        )}

        {/* Main content */}
        <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
          {/* Hint */}
          {currentWord?.hint && (
            <View className="bg-blue-50 rounded-2xl p-4">
              <Text className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                Hint
              </Text>
              <Text className="text-base text-blue-900 font-medium">{currentWord.hint}</Text>
            </View>
          )}

          {/* Scrambled/hint display */}
          {config.scrambled ? (
            <View className="items-center gap-4">
              <Text className="text-xs text-gray-400 uppercase tracking-wide">Unscramble these letters</Text>
              <View className="flex-row flex-wrap justify-center gap-3">
                {scrambledWord.split('').map((letter, i) => (
                  <View
                    key={i}
                    // increased size for easier tapping/reading
                    style={{ width: 72, height: 72, backgroundColor: '#fff', borderRadius: 18, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f2937' }}>{letter}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="items-center gap-2">
              <Text className="text-xs text-gray-400 uppercase tracking-wide">Type the word</Text>
              {config.showLetterHints && currentWord && (
                <Text className="text-lg font-semibold text-gray-600">
                  _ {currentWord.word.slice(1).split('').map(() => '_').join(' ')} _
                </Text>
              )}
            </View>
          )}

          {/* Image hint placeholder (simple, optional) */}
          {currentWord?.image && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Image source={{ uri: currentWord.image }} style={{ width: 160, height: 120, borderRadius: 12 }} />
            </View>
          )}

          {/* Input field */}
          <View className="gap-2">
            <TextInput
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer..."
              placeholderTextColor="#9ca3af"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              // keep editable unless the user already got it correct
              editable={feedback !== 'correct'}
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

          {/* Submit button */}
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

          {/* Skip button shown when user wants to move on after incorrect */}
          {feedback === 'incorrect' && (
            <TouchableOpacity
              onPress={() => handleNextWord(false)}
              className="mt-3 items-center"
            >
              <Text className="text-sm text-gray-500">Skip this word</Text>
            </TouchableOpacity>
          )}
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