import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, SequenceItem, SpotDifferenceConfig } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import { Dimensions, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

type Phase = 'instruction' | 'play' | 'result';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function shuffleRange(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SpotDifferenceGame() {
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading, refresh: refreshContent, difficulty } = usePersonalizedGameContent<SpotDifferenceConfig>(
    'spot_difference',
    routeDifficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<SpotDifferenceConfig | null>(null);
  const config = frozenConfig ?? liveConfig;

  const [phase, setPhase] = useState<Phase>('instruction');
  const [gridB, setGridB] = useState<SequenceItem[]>([]);
  const [changed, setChanged] = useState<Set<number>>(new Set());
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrongTaps, setWrongTaps] = useState(0);
  const [lastWrong, setLastWrong] = useState<number | null>(null);
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

  const finishGame = useCallback(
    (foundCount: number) => {
      if (foundCount === config.differenceCount) playSound('success');
      else if (foundCount === 0) playSound('error');
      else playSound('click');

      const nextResult: GameSessionResult = {
        gameId: 'spot_difference',
        difficulty,
        score: foundCount,
        maxScore: config.differenceCount,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: foundCount,
        totalAnswers: config.differenceCount,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setShowConfetti(true);
      Speech.speak(`You found ${foundCount} out of ${config.differenceCount} changes.`);
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('result');
      }, 1100);
    },
    [config.differenceCount, difficulty, startTime, playSound, saveGameSession],
  );

  const timer = useQuestionTimer({
    limitSeconds: phase === 'play' ? config.timeLimitSeconds : null,
    onExpire: () => finishGame(found.size),
    autoStart: phase === 'play' && Boolean(config.timeLimitSeconds),
  });

  const handleStart = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    const cellCount = frozen.rows * frozen.columns;
    const changedIdx = shuffleRange(cellCount).slice(0, frozen.differenceCount);
    const decoys = frozen.distractors ?? [];
    const nextB = [...frozen.items];
    changedIdx.forEach((idx, k) => {
      if (decoys[k]) nextB[idx] = decoys[k];
    });
    setGridB(nextB);
    setChanged(new Set(changedIdx));
    setFound(new Set());
    setWrongTaps(0);
    setLastWrong(null);
    setStartTime(Date.now());
    setPhase('play');
    Speech.speak(`Find the ${frozen.differenceCount} tiles that are different in the bottom picture.`);
  };

  const handleTapB = (index: number) => {
    if (phase !== 'play' || found.has(index)) return;
    if (changed.has(index)) {
      playSound('success');
      const next = new Set(found).add(index);
      setFound(next);
      if (next.size === config.differenceCount) {
        setTimeout(() => finishGame(next.size), 400);
      }
    } else {
      // Wrong tap: no credit, brief flash.
      playSound('error');
      setWrongTaps(w => w + 1);
      setLastWrong(index);
      setTimeout(() => setLastWrong(prev => (prev === index ? null : prev)), 350);
    }
  };

  const handleReset = () => {
    playSound('click');
    Speech.stop();
    refreshContent(progress?.difficulty);
    setFrozenConfig(null);
    setPhase('instruction');
    setGridB([]);
    setChanged(new Set());
    setFound(new Set());
    setWrongTaps(0);
    setLastWrong(null);
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
        gameId="spot_difference"
        difficulty={difficulty}
        steps={[
          { icon: '👀', text: 'Look at the two pictures - they are almost the same' },
          { icon: '🔎', text: `Find the ${config.differenceCount} tiles that are different` },
          { icon: '👆', text: 'Tap each changed tile in the bottom picture' },
          ...(config.timeLimitSeconds ? [{ icon: '⏱️', text: `You have ${config.timeLimitSeconds} seconds` }] : []),
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

  const boardWidth = Math.min(SCREEN_WIDTH - 40, 340);
  const gap = 8;
  const cellSize = (boardWidth - gap * (config.columns - 1)) / config.columns;

  const renderCell = (item: SequenceItem, index: number, tappable: boolean) => {
    const isFound = tappable && found.has(index);
    const isWrong = tappable && lastWrong === index;
    return (
      <TouchableOpacity
        key={`${tappable ? 'b' : 'a'}-${index}`}
        activeOpacity={tappable ? 0.7 : 1}
        disabled={!tappable}
        onPress={() => handleTapB(index)}
        style={{
          width: cellSize,
          height: cellSize,
          borderRadius: 12,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: isFound ? '#22C55E' : isWrong ? '#EF4444' : '#e5e7eb',
          backgroundColor: isFound ? '#DCFCE7' : '#ffffff',
        }}
      >
        {canShowImage(item.image) ? (
          <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => markImageFailed(item.image)} />
        ) : (
          <Text style={{ fontSize: cellSize * 0.5 }}>{item.emoji}</Text>
        )}
        {isFound && (
          <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#22C55E', borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGrid = (items: SequenceItem[], tappable: boolean) => (
    <View style={{ width: boardWidth, flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {items.map((item, index) => renderCell(item, index, tappable))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={90} origin={{ x: 180, y: 0 }} fadeOut />}
      <GameHeader
        title="Spot the Difference"
        difficulty={difficulty}
        timeLeft={config.timeLimitSeconds ? timer.secondsLeft : null}
        totalSeconds={config.timeLimitSeconds}
        onBack={handleGoBack}
      />

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 10 }} showsVerticalScrollIndicator={false}>
        <Text className="text-sm font-bold text-orange-600">
          Found {found.size} of {config.differenceCount}
        </Text>

        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Original</Text>
        {renderGrid(config.items, false)}

        <View style={{ height: 1, backgroundColor: '#e5e7eb', width: boardWidth, marginVertical: 4 }} />

        <Text className="text-xs font-semibold text-orange-500 uppercase tracking-widest">Tap what changed</Text>
        {renderGrid(gridB, true)}
      </ScrollView>
    </SafeAreaView>
  );
}
