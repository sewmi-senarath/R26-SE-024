import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { getGameContent } from '@/src/constants/gameContent';
import { pickAttentionTheme } from '@/src/constants/game-content/attentionThemes';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { AttentionGameConfig, Difficulty, DifficultyProgressUpdate, GameSessionResult } from '@/src/types/games.types';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Phase = 'instruction' | 'playing' | 'result';

function buildGrid(config: AttentionGameConfig): string[] {
  const total = config.gridSize * config.gridSize;
  const grid: string[] = [];
  const targetIndices = new Set<number>();

  while (targetIndices.size < config.targetCount) {
    targetIndices.add(Math.floor(Math.random() * total));
  }

  for (let i = 0; i < total; i++) {
    if (targetIndices.has(i)) {
      grid.push(config.targetEmoji);
    } else {
      const d = config.distractorEmojis[Math.floor(Math.random() * config.distractorEmojis.length)];
      grid.push(d);
    }
  }

  return grid;
}

function AttentionCell({
  emoji,
  size,
  flashed,
  onPress,
}: {
  emoji: string;
  size: number;
  flashed: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (flashed) {
      scale.value = withSequence(
        withTiming(1.25, { duration: 100, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) }),
      );
    }
  }, [flashed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        entering={ZoomIn.duration(250)}
        style={[
          {
            width: size,
            height: size,
            backgroundColor: flashed ? '#dbeafe' : '#ffffff',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#f3f4f6',
          },
          animStyle,
        ]}
      >
        <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AttentionGame() {
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const [difficulty, setDifficulty] = useState<Difficulty>(routeDifficulty);
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const baseConfig = getGameContent<AttentionGameConfig>('attention_game', difficulty);

  // Rotate the target/distractor theme across sessions so a returning patient
  // isn't always hunting the same star among the same circles. Difficulty is
  // preserved: only which emojis are used changes, never the grid, speed, or
  // counts. `theme` is picked fresh on mount and whenever a new game starts.
  const [theme, setTheme] = useState<{ targetEmoji: string; distractorEmojis: string[] } | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);
  const themeRequestRef = useRef(0);

  const loadTheme = useCallback((distractorCount: number) => {
    themeRequestRef.current += 1;
    const requestId = themeRequestRef.current;
    setThemeLoading(true);
    pickAttentionTheme(distractorCount)
      .then((t) => {
        if (themeRequestRef.current !== requestId) return;
        setTheme({ targetEmoji: t.targetEmoji, distractorEmojis: t.distractorEmojis });
      })
      .catch(() => {
        if (themeRequestRef.current === requestId) setTheme(null);
      })
      .finally(() => {
        if (themeRequestRef.current === requestId) setThemeLoading(false);
      });
  }, []);

  useEffect(() => {
    loadTheme(baseConfig.distractorEmojis.length);
  }, [baseConfig.distractorEmojis.length, loadTheme]);

  const config = useMemo<AttentionGameConfig>(
    () => (theme ? { ...baseConfig, targetEmoji: theme.targetEmoji, distractorEmojis: theme.distractorEmojis } : baseConfig),
    [baseConfig, theme],
  );

  const [phase, setPhase] = useState<Phase>('instruction');
  const [grid, setGrid] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [taps, setTaps] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [totalStarsShown, setTotalStarsShown] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [gridVersion, setGridVersion] = useState(0);

  const scoreRef = useRef(score);
  const tapsRef = useRef(taps);
  const startTimeRef = useRef(startTime);
  const totalStarsShownRef = useRef(totalStarsShown);
  const tappedCellsRef = useRef<Set<number>>(new Set());

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { tapsRef.current = taps; }, [taps]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { totalStarsShownRef.current = totalStarsShown; }, [totalStarsShown]);

  const createNewRound = useCallback(() => {
    setGrid(buildGrid(config));
    setGridVersion((v) => v + 1);
    tappedCellsRef.current = new Set();
    setTotalStarsShown((n) => {
      const next = n + config.targetCount;
      totalStarsShownRef.current = next;
      return next;
    });
  }, [config]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => {
      createNewRound();
    }, config.intervalMs);
    return () => clearInterval(t);
  }, [phase, config, createNewRound]);

  const finishGame = useCallback(() => {
    const finalScore = scoreRef.current;
    const finalTaps = tapsRef.current;
    const maxScore = totalStarsShownRef.current;
    const accuracy = finalTaps > 0 ? finalScore / finalTaps : 0;

    if (accuracy > 0.7) {
      playSound('success');
    } else if (accuracy < 0.3) {
      playSound('error');
    } else {
      playSound('click');
    }

    const elapsedSec = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : config.timeLimitSeconds;

    const nextResult: GameSessionResult = {
      gameId: 'attention_game',
      difficulty,
      score: finalScore,
      maxScore: maxScore || config.targetCount,
      timeTakenSeconds: elapsedSec,
      completedAt: new Date().toISOString(),
      correctAnswers: finalScore,
      totalAnswers: finalTaps,
    };
    setResult(nextResult);
    saveGameSession(nextResult).then(setProgress);
    setPhase('result');
  }, [config, difficulty, playSound, saveGameSession]);

  const timer = useQuestionTimer({
    limitSeconds: phase === 'playing' ? config.timeLimitSeconds : null,
    onExpire: () => finishGame(),
    autoStart: phase === 'playing',
  });

  const handleTap = (index: number) => {
    playSound('click');

    const tapped = grid[index];
    setFlashIndex(index);
    setTimeout(() => setFlashIndex(null), 200);

    setTaps((t) => {
      const nt = t + 1;
      tapsRef.current = nt;
      return nt;
    });

    // Count each target only once per round
    if (tapped === config.targetEmoji && !tappedCellsRef.current.has(index)) {
      tappedCellsRef.current.add(index);
      setScore((s) => {
        const ns = s + 1;
        scoreRef.current = ns;
        return ns;
      });
    }
  };

  const handleReset = () => {
    playSound('click');
    const nextDifficulty = progress?.difficulty ?? difficulty;
    const nextConfig = getGameContent<AttentionGameConfig>('attention_game', nextDifficulty);
    setDifficulty(nextDifficulty);
    setTheme(null);
    loadTheme(nextConfig.distractorEmojis.length);
    setPhase('instruction');
    setScore(0);
    scoreRef.current = 0;
    setTaps(0);
    tapsRef.current = 0;
    setResult(null);
    setProgress(null);
    setStartTime(0);
    startTimeRef.current = 0;
    setTotalStarsShown(0);
    totalStarsShownRef.current = 0;
    tappedCellsRef.current = new Set();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="attention_game"
        difficulty={difficulty}
        steps={[
          { icon: '🎯', text: `Tap every ${config.targetEmoji} you see - ignore other shapes` },
          { icon: '⏱️', text: `You have ${config.timeLimitSeconds} seconds` },
          { icon: '📊', text: `Grid is ${config.gridSize} X ${config.gridSize} with ${config.targetCount} targets hidden` },
        ]}
        onStart={() => {
          playSound('click');
          setScore(0);
          scoreRef.current = 0;
          setTaps(0);
          tapsRef.current = 0;
          setTotalStarsShown(0);
          totalStarsShownRef.current = 0;
          tappedCellsRef.current = new Set();

          createNewRound();

          const now = Date.now();
          setStartTime(now);
          startTimeRef.current = now;
          setPhase('playing');
        }}
        startDisabled={themeLoading}
        startLabel={themeLoading ? 'Preparing your game…' : 'Start Game'}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} progress={progress} onPlayAgain={handleReset} />;
  }

  const cellSize = Math.floor(280 / config.gridSize);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <GameHeader
        title="Attention Game"
        difficulty={difficulty}
        timeLeft={timer.secondsLeft}
        totalSeconds={config.timeLimitSeconds}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, alignItems: 'center' }}>
        <View className="flex-row gap-6 mb-4">
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">{score}</Text>
            <Text className="text-xs text-gray-400">Hits</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-gray-400">{taps - score}</Text>
            <Text className="text-xs text-gray-400">Misses</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 bg-blue-50 rounded-xl px-4 py-2 mb-4">
          <Text className="text-xs text-blue-600">Tap this →</Text>
          <Text style={{ fontSize: 24 }}>{config.targetEmoji}</Text>
        </View>

        <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
          <View
            className={`h-full rounded-full ${timer.isWarning ? 'bg-red-400' : 'bg-blue-400'}`}
            style={{ width: `${100 - timer.progressPercent}%` }}
          />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: config.gridSize * (cellSize + 6), justifyContent: 'center', gap: 3 }}>
          {grid.map((emoji, i) => (
            <AttentionCell
              key={`${i}-${gridVersion}`}
              emoji={emoji}
              size={cellSize}
              flashed={flashIndex === i}
              onPress={() => handleTap(i)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
