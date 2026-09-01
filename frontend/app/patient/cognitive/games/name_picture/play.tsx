import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, NamePictureConfig, SequenceItem } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import {
  Image,
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
type Question = { item: SequenceItem; options: string[] };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function answersMatch(typed: string, correct: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/^(a|an|the)\s+/, '');
  const t = norm(typed);
  const c = norm(correct);
  if (!t) return false;
  return t === c || (t.length >= 3 && (c.includes(t) || t.includes(c)));
}

export default function NamePictureGame() {
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading, refresh: refreshContent, difficulty } = usePersonalizedGameContent<NamePictureConfig>(
    'name_picture',
    routeDifficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<NamePictureConfig | null>(null);
  const config = frozenConfig ?? liveConfig;
  const isTypeMode = config.answerMode === 'type';

  const [phase, setPhase] = useState<Phase>('instruction');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const markImageFailed = useCallback((uri?: string) => {
    if (!uri) return;
    setFailedImages(prev => (prev.has(uri) ? prev : new Set(prev).add(uri)));
  }, []);
  const canShowImage = (uri?: string) => !!uri && !failedImages.has(uri);

  const current = questions[currentIndex];

  const buildQuestions = (cfg: NamePictureConfig): Question[] => {
    const namePool = [
      ...(cfg.distractors ?? []),
      ...cfg.items,
    ];
    return cfg.items.map((item) => {
      const correct = item.label;
      // Prefer same-category decoy names, then fill from the rest.
      const sameCat = namePool.filter(
        (n) => n.category === item.category && n.label.toLowerCase() !== correct.toLowerCase(),
      );
      const otherCat = namePool.filter(
        (n) => n.category !== item.category && n.label.toLowerCase() !== correct.toLowerCase(),
      );
      const seen = new Set([correct.toLowerCase()]);
      const decoys: string[] = [];
      [...shuffle(sameCat), ...shuffle(otherCat)].forEach((n) => {
        const key = n.label.toLowerCase();
        if (!seen.has(key) && decoys.length < cfg.optionsCount - 1) {
          seen.add(key);
          decoys.push(n.label);
        }
      });
      return { item, options: shuffle([correct, ...decoys]) };
    });
  };

  const finishGame = useCallback(
    (finalScore: number) => {
      if (finalScore === config.itemCount) playSound('success');
      else if (finalScore === 0) playSound('error');
      else playSound('click');

      const nextResult: GameSessionResult = {
        gameId: 'name_picture',
        difficulty,
        score: finalScore,
        maxScore: config.itemCount,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: finalScore,
        totalAnswers: config.itemCount,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setShowConfetti(true);
      Speech.speak(`You named ${finalScore} out of ${config.itemCount} correctly.`);
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('result');
      }, 1100);
    },
    [config.itemCount, difficulty, startTime, playSound, saveGameSession],
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
    if (feedback || !current) return;
    const normalized = answer.trim();
    if (!normalized) return;
    const correct = current.item.label;
    const isCorrect = isTypeMode
      ? answersMatch(normalized, correct)
      : normalized.toLowerCase() === correct.trim().toLowerCase();

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
      Speech.speak(`It is a ${correct}.`);
    }
    setTimeout(() => advance(nextScore), 1100);
  };

  const handleSkip = () => {
    if (feedback) return;
    playSound('click');
    Speech.stop();
    advance(score);
  };

  const handleStart = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    setQuestions(buildQuestions(frozen));
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
    setQuestions([]);
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
        gameId="name_picture"
        difficulty={difficulty}
        steps={[
          { icon: '🖼️', text: `You will see ${config.itemCount} pictures, one at a time` },
          {
            icon: isTypeMode ? '✍️' : '👆',
            text: isTypeMode ? 'Type the name of each picture' : 'Choose the correct name for each picture',
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={70} origin={{ x: -10, y: 0 }} fadeOut />}
      <GameHeader title="Name the Picture" difficulty={difficulty} timeLeft={null} totalSeconds={null} onBack={handleGoBack} />

      {current && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-gray-700">
                Picture {currentIndex + 1} of {questions.length}
              </Text>
              <Text className="text-sm font-bold text-violet-600">{score} correct</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <View className="h-full bg-violet-500 rounded-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </View>

            <Animated.View key={currentIndex} entering={ZoomIn.duration(350)} style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 200, height: 200, borderRadius: 28, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                {canShowImage(current.item.image) ? (
                  <Image source={{ uri: current.item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => markImageFailed(current.item.image)} />
                ) : (
                  <Text style={{ fontSize: 110 }}>{current.item.emoji}</Text>
                )}
              </View>
              <Text className="text-lg font-semibold text-gray-500 mt-4">What is this?</Text>
            </Animated.View>

            {isTypeMode ? (
              <View className="gap-3">
                <TextInput
                  value={typedValue}
                  onChangeText={setTypedValue}
                  editable={!feedback}
                  placeholder="Type the name…"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  style={{ height: 58, backgroundColor: '#fff', borderWidth: 2, borderColor: feedback === 'correct' ? '#22C55E' : feedback === 'incorrect' ? '#EF4444' : '#e5e7eb', borderRadius: 16, paddingHorizontal: 16, fontSize: 18, color: '#111827' }}
                />
                <TouchableOpacity
                  onPress={() => evaluate(typedValue)}
                  disabled={Boolean(feedback) || typedValue.trim().length === 0}
                  activeOpacity={0.85}
                  className={`py-4 rounded-2xl items-center ${Boolean(feedback) || typedValue.trim().length === 0 ? 'bg-gray-200' : 'bg-violet-500'}`}
                >
                  <Text className={`text-lg font-bold ${Boolean(feedback) || typedValue.trim().length === 0 ? 'text-gray-400' : 'text-white'}`}>Submit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                {current.options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrectOption = option.toLowerCase() === current.item.label.toLowerCase();
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
                accessibilityLabel="Skip this picture"
              >
                <Text className="text-base font-semibold text-gray-400">Skip</Text>
                <Ionicons name="play-skip-forward-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {feedback && (
              <Animated.View entering={FadeInUp.duration(300)} className={`mt-5 p-3 rounded-xl flex-row items-center justify-center gap-1.5 ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
                <Ionicons name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'} size={18} color={feedback === 'correct' ? '#15803D' : '#B91C1C'} />
                <Text className={`font-semibold ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                  {feedback === 'correct' ? 'Correct!' : `It is a ${current.item.label}`}
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
