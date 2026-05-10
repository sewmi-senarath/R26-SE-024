import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { getGameContent } from '@/src/constants/gameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { AttentionGameConfig, Difficulty, GameSessionResult } from '@/src/types/games.types';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

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

export default function AttentionGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const { playSound } = useSoundEffects();
  const config = getGameContent<AttentionGameConfig>('attention_game', difficulty);

  const [phase, setPhase] = useState<Phase>('instruction');
  const [grid, setGrid] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [taps, setTaps] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [totalStarsShown, setTotalStarsShown] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);

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

    setResult({
      gameId: 'attention_game',
      difficulty,
      score: finalScore,
      maxScore: maxScore || config.targetCount,
      timeTakenSeconds: elapsedSec,
      completedAt: new Date().toISOString(),
      correctAnswers: finalScore,
      totalAnswers: finalTaps,
    });
    setPhase('result');
  }, [config, difficulty, playSound]);

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
    setPhase('instruction');
    setScore(0);
    scoreRef.current = 0;
    setTaps(0);
    tapsRef.current = 0;
    setResult(null);
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
          { icon: '🎯', text: `Tap every ${config.targetEmoji} you see — ignore the other shapes` },
          { icon: '⚡', text: 'The grid shuffles quickly — stay focused' },
          { icon: '⏱️', text: `You have ${config.timeLimitSeconds} seconds` },
          { icon: '📊', text: `Grid is ${config.gridSize}×${config.gridSize} with ${config.targetCount} targets hidden` },
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
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} onPlayAgain={handleReset} />;
  }

  const cellSize = Math.floor(280 / config.gridSize);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <GameHeader
        title="Attention Game"
        difficulty={difficulty}
        timeLeft={timer.secondsLeft}
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
            <TouchableOpacity
              key={i}
              onPress={() => handleTap(i)}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: flashIndex === i ? '#dbeafe' : '#ffffff',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#f3f4f6',
              }}
            >
              <Text style={{ fontSize: cellSize * 0.45 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}