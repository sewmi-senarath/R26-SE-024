import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, GridFlashConfig } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { ZoomIn } from 'react-native-reanimated';

type Phase = 'instruction' | 'showing' | 'recall' | 'result';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function shuffleNumbers(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GridFlashGame() {
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading, refresh: refreshContent, difficulty } = usePersonalizedGameContent<GridFlashConfig>(
    'grid_flash',
    routeDifficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<GridFlashConfig | null>(null);
  const config = frozenConfig ?? liveConfig;
  const cellCount = config.gridSize * config.gridSize;

  const [phase, setPhase] = useState<Phase>('instruction');
  // The cell positions (0..cellCount-1) that light up, in order.
  const [sequence, setSequence] = useState<number[]>([]);
  // Which cell is lit right now during the showing phase, and its step index.
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  // Positions the patient has tapped back, in order.
  const [tapped, setTapped] = useState<number[]>([]);
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

  // Drive the flash sequence: light each cell for flashTimeMs, then a short gap.
  useEffect(() => {
    if (phase !== 'showing' || sequence.length === 0) return;
    let step = 0;
    let onTimer: ReturnType<typeof setTimeout>;
    let offTimer: ReturnType<typeof setTimeout>;

    const runStep = () => {
      if (step >= sequence.length) {
        setActiveCell(null);
        offTimer = setTimeout(() => setPhase('recall'), 500);
        return;
      }
      setActiveCell(sequence[step]);
      setActiveStep(step);
      playSound('click');
      onTimer = setTimeout(() => {
        setActiveCell(null);
        offTimer = setTimeout(() => {
          step += 1;
          runStep();
        }, 320);
      }, config.flashTimeMs);
    };

    runStep();
    return () => {
      clearTimeout(onTimer);
      clearTimeout(offTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence]);

  useEffect(() => {
    if (phase === 'recall') {
      Speech.speak('Now tap the cells in the same order they lit up. Take your time.');
    }
  }, [phase]);

  const handleStart = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    const positions = shuffleNumbers(frozen.gridSize * frozen.gridSize).slice(
      0,
      frozen.sequenceLength,
    );
    setSequence(positions);
    setTapped([]);
    setActiveStep(0);
    setStartTime(Date.now());
    setPhase('showing');
    Speech.speak('Watch carefully which cells light up.');
  };

  const finishGame = useCallback(
    (finalTapped: number[]) => {
      // Order-aware, keep-scoring: +1 for every step placed in the right spot.
      let correct = 0;
      sequence.forEach((pos, i) => {
        if (finalTapped[i] === pos) correct += 1;
      });

      if (correct === sequence.length) playSound('success');
      else if (correct === 0) playSound('error');
      else playSound('click');

      const nextResult: GameSessionResult = {
        gameId: 'grid_flash',
        difficulty,
        score: correct,
        maxScore: sequence.length,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: correct,
        totalAnswers: sequence.length,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setShowConfetti(true);
      Speech.speak(`You got ${correct} out of ${sequence.length}.`);
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('result');
      }, 1100);
    },
    [sequence, difficulty, startTime, playSound, saveGameSession],
  );

  const handleCellPress = (pos: number) => {
    if (phase !== 'recall') return;
    if (tapped.includes(pos)) return; // each cell is used at most once
    playSound('click');
    const next = [...tapped, pos];
    setTapped(next);
    if (next.length === sequence.length) {
      setTimeout(() => finishGame(next), 250);
    }
  };

  const handleUndo = () => {
    if (!tapped.length) return;
    playSound('click');
    setTapped(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    playSound('click');
    refreshContent(progress?.difficulty);
    setFrozenConfig(null);
    setPhase('instruction');
    setSequence([]);
    setTapped([]);
    setActiveCell(null);
    setActiveStep(0);
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
        gameId="grid_flash"
        difficulty={difficulty}
        steps={[
          { icon: '👀', text: `Watch ${config.sequenceLength} cells light up one by one` },
          { icon: '🧠', text: 'Remember the order they lit up in' },
          { icon: '👆', text: 'Then tap the cells back in the same order' },
        ]}
        onStart={handleStart}
        onBack={handleGoBack}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your game…' : 'Start Game'}
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

  // Grid geometry.
  const boardSize = Math.min(SCREEN_WIDTH - 48, 360);
  const gap = 10;
  const cellSize = (boardSize - gap * (config.gridSize - 1)) / config.gridSize;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={90} origin={{ x: 180, y: 0 }} fadeOut />}
      <GameHeader
        title="Grid Flash"
        difficulty={difficulty}
        timeLeft={null}
        totalSeconds={null}
        onBack={handleGoBack}
      />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 20 }}>
        <Text className="text-base text-gray-600 text-center font-semibold">
          {phase === 'showing'
            ? `Watch the cells (${Math.min(activeStep + 1, config.sequenceLength)} of ${config.sequenceLength})`
            : `Tap the cells in order (${tapped.length} of ${config.sequenceLength})`}
        </Text>

        <View style={{ width: boardSize, flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {Array.from({ length: cellCount }).map((_, pos) => {
            const isLit = phase === 'showing' && activeCell === pos;
            const litItem = isLit ? config.items[activeStep] : null;
            const tapOrder = tapped.indexOf(pos);
            const isTapped = tapOrder !== -1;

            return (
              <TouchableOpacity
                key={pos}
                activeOpacity={phase === 'recall' ? 0.7 : 1}
                onPress={() => handleCellPress(pos)}
                disabled={phase !== 'recall'}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 16,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isLit ? '#0D9488' : isTapped ? '#14B8A6' : '#e5e7eb',
                  backgroundColor: isLit ? '#14B8A6' : isTapped ? '#CCFBF1' : '#ffffff',
                }}
              >
                {isLit && litItem ? (
                  <Animated.View
                    entering={ZoomIn.duration(200)}
                    style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {canShowImage(litItem.image) ? (
                      <Image
                        source={{ uri: litItem.image }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        onError={() => markImageFailed(litItem.image)}
                      />
                    ) : (
                      <Text style={{ fontSize: cellSize * 0.42 }}>{litItem.emoji}</Text>
                    )}
                    {config.showLabels && (
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(17,24,39,0.55)', paddingVertical: 2 }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>
                          {litItem.label}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                ) : isTapped ? (
                  <Text style={{ fontSize: cellSize * 0.34, fontWeight: '800', color: '#0D9488' }}>
                    {tapOrder + 1}
                  </Text>
                ) : (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {phase === 'recall' && (
          <TouchableOpacity
            onPress={handleUndo}
            disabled={!tapped.length}
            activeOpacity={0.8}
            className="flex-row items-center gap-2 px-5 py-3 rounded-2xl"
            style={{ backgroundColor: tapped.length ? '#eef2f7' : '#f3f4f6', opacity: tapped.length ? 1 : 0.5 }}
          >
            <Ionicons name="arrow-undo-outline" size={16} color="#475569" />
            <Text className="text-sm font-bold text-gray-600">Undo</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
