import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, SentenceCompletionConfig } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
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

type Phase = 'instruction' | 'play' | 'result';

function answersMatch(typed: string, correct: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/^(a|an|the)\s+/, '');
  const t = norm(typed);
  const c = norm(correct);
  if (!t) return false;
  return t === c || (t.length >= 3 && (c.includes(t) || t.includes(c)));
}

function splitBlank(text: string): [string, string] {
  const idx = text.indexOf('___');
  if (idx === -1) return [text, ''];
  return [text.slice(0, idx), text.slice(idx + 3)];
}

export default function SentenceCompletionGame() {
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading, refresh: refreshContent, difficulty } = usePersonalizedGameContent<SentenceCompletionConfig>(
    'sentence_completion',
    routeDifficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<SentenceCompletionConfig | null>(null);
  const config = frozenConfig ?? liveConfig;
  const isTypeMode = config.answerMode === 'type';
  const items = config.items ?? [];

  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const current = items[currentIndex];
  const [before, after] = current ? splitBlank(current.text) : ['', ''];

  const finishGame = useCallback(
    (finalScore: number) => {
      if (finalScore === items.length) playSound('success');
      else if (finalScore === 0) playSound('error');
      else playSound('click');

      const nextResult: GameSessionResult = {
        gameId: 'sentence_completion',
        difficulty,
        score: finalScore,
        maxScore: items.length,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: finalScore,
        totalAnswers: items.length,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setShowConfetti(true);
      Speech.speak(`You completed ${finalScore} out of ${items.length} sentences.`);
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('result');
      }, 1100);
    },
    [items.length, difficulty, startTime, playSound, saveGameSession],
  );

  const advance = useCallback(
    (scoreNow: number) => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setTypedValue('');
        setFeedback(null);
      } else {
        finishGame(scoreNow);
      }
    },
    [currentIndex, items.length, finishGame],
  );

  const evaluate = (answer: string) => {
    if (feedback || !current) return;
    const normalized = answer.trim();
    if (!normalized) return;
    const isCorrect = isTypeMode
      ? answersMatch(normalized, current.answer)
      : normalized.toLowerCase() === current.answer.trim().toLowerCase();

    setSelectedOption(isTypeMode ? null : normalized);
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) {
      setScore(nextScore);
      setFeedback('correct');
      playSound('success');
      Speech.speak('Correct!');
    } else {
      setFeedback('incorrect');
      playSound('error');
      Speech.speak(`The word is ${current.answer}.`);
    }
    setTimeout(() => advance(nextScore), 1200);
  };

  const handleSkip = () => {
    if (feedback) return;
    playSound('click');
    Speech.stop();
    advance(score);
  };

  const handleStart = () => {
    playSound('click');
    setFrozenConfig(liveConfig);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setTypedValue('');
    setFeedback(null);
    setStartTime(Date.now());
    setPhase('play');
  };

  const handleReset = () => {
    playSound('click');
    Speech.stop();
    refreshContent(progress?.difficulty);
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
        gameId="sentence_completion"
        difficulty={difficulty}
        steps={[
          { icon: '📄', text: `You will see ${config.blankCount} sentences with a missing word` },
          {
            icon: isTypeMode ? '✍️' : '👆',
            text: isTypeMode ? 'Type the word that fits the blank' : 'Choose the word that fits the blank',
          },
        ]}
        onStart={handleStart}
        onBack={handleGoBack}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your game…' : 'Start Game'}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} progress={progress} onPlayAgain={handleReset} onBack={handleGoBack} />;
  }

  const blankText = feedback ? current?.answer : '_____';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={70} origin={{ x: -10, y: 0 }} fadeOut />}
      <GameHeader title="Finish the Sentence" difficulty={difficulty} timeLeft={null} totalSeconds={null} onBack={handleGoBack} />

      {current && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-gray-700">
                Sentence {currentIndex + 1} of {items.length}
              </Text>
              <Text className="text-sm font-bold text-lime-700">{score} correct</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <View className="h-full rounded-full" style={{ width: `${((currentIndex + 1) / items.length) * 100}%`, backgroundColor: '#65A30D' }} />
            </View>

            <Animated.View key={currentIndex} entering={ZoomIn.duration(350)} className="bg-white rounded-3xl border border-lime-100 p-6 mb-6">
              <Text style={{ fontSize: 24, lineHeight: 36, color: '#1f2937', textAlign: 'center' }}>
                {before}
                <Text style={{ fontWeight: '800', color: feedback === 'correct' ? '#15803D' : feedback === 'incorrect' ? '#B91C1C' : '#65A30D' }}>
                  {blankText}
                </Text>
                {after}
              </Text>
            </Animated.View>

            {isTypeMode ? (
              <View className="gap-3">
                <TextInput
                  value={typedValue}
                  onChangeText={setTypedValue}
                  editable={!feedback}
                  placeholder="Type the missing word…"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  style={{ height: 58, backgroundColor: '#fff', borderWidth: 2, borderColor: feedback === 'correct' ? '#22C55E' : feedback === 'incorrect' ? '#EF4444' : '#e5e7eb', borderRadius: 16, paddingHorizontal: 16, fontSize: 18, color: '#111827' }}
                />
                <TouchableOpacity
                  onPress={() => evaluate(typedValue)}
                  disabled={Boolean(feedback) || typedValue.trim().length === 0}
                  activeOpacity={0.85}
                  className={`py-4 rounded-2xl items-center ${Boolean(feedback) || typedValue.trim().length === 0 ? 'bg-gray-200' : 'bg-lime-600'}`}
                >
                  <Text className={`text-lg font-bold ${Boolean(feedback) || typedValue.trim().length === 0 ? 'text-gray-400' : 'text-white'}`}>Submit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                {(current.options ?? []).map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrectOption = option.toLowerCase() === current.answer.toLowerCase();
                  const showCorrect = feedback && isCorrectOption;
                  const showWrong = isSelected && !isCorrectOption;
                  return (
                    <Animated.View key={option} entering={FadeInUp.delay(index * 60).duration(300)}>
                      <TouchableOpacity
                        onPress={() => evaluate(option)}
                        disabled={Boolean(feedback)}
                        activeOpacity={0.85}
                        className={`py-5 px-6 rounded-2xl border-2 ${showCorrect ? 'bg-green-50 border-green-400' : showWrong ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200'}`}
                      >
                        <Text className={`text-lg font-semibold text-center ${showCorrect ? 'text-green-700' : showWrong ? 'text-red-700' : 'text-gray-800'}`}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {!feedback && (
              <TouchableOpacity
                onPress={handleSkip}
                activeOpacity={0.7}
                className="mt-5 flex-row items-center justify-center gap-1.5 py-3"
                accessibilityRole="button"
                accessibilityLabel="Skip this sentence"
              >
                <Text className="text-base font-semibold text-gray-400">Skip</Text>
                <Ionicons name="play-skip-forward-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {feedback && (
              <Animated.View entering={FadeInUp.duration(300)} className={`mt-5 p-3 rounded-xl flex-row items-center justify-center gap-1.5 ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
                <Ionicons name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'} size={18} color={feedback === 'correct' ? '#15803D' : '#B91C1C'} />
                <Text className={`font-semibold ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                  {feedback === 'correct' ? 'Correct!' : `The word is ${current.answer}`}
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
