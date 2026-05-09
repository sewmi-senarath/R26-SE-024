import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { getGameContent } from '@/src/constants/gameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, GameSessionResult, MemoryRecallConfig } from '@/src/types/games.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

type Phase = 'instruction' | 'showing' | 'recall' | 'result';

export default function MemoryRecallGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const config = getGameContent<MemoryRecallConfig>('memory_recall', difficulty);

  const [phase, setPhase] = useState<Phase>('instruction');
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);

  useEffect(() => {
    if (phase !== 'showing') return;
    if (currentShowIndex >= config.items.length) {
      setTimeout(() => setPhase('recall'), 500);
      return;
    }
    const t = setTimeout(() => setCurrentShowIndex(i => i + 1), config.displayTimeMs);
    return () => clearTimeout(t);
  }, [phase, currentShowIndex, config]);

  const timer = useQuestionTimer({
    limitSeconds: phase === 'recall' ? config.timeLimitSeconds : null,
    onExpire: () => finishGame(),
    autoStart: phase === 'recall',
  });

  const handleStart = () => {
    playSound('click');
    setPhase('showing');
    setCurrentShowIndex(0);
    setStartTime(Date.now());
  };

  const ALL_OPTIONS = useMemo(() => {
    const extras = [
      { id: 'd1', emoji: '🎸', label: 'Guitar', category: 'Music' },
      { id: 'd2', emoji: '🚂', label: 'Train', category: 'Vehicle' },
      { id: 'd3', emoji: '🍕', label: 'Pizza', category: 'Food' },
    ];
    const base = [...config.items, ...extras];
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    return base;
  }, [config.items]);

  const toggleSelect = useCallback((id: string) => {
    playSound('click');
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(x => x !== id) : [...prev, id];
      const item = ALL_OPTIONS.find(o => o.id === id);
      if (item) {
        Speech.speak(isSelected ? `${item.label} deselected` : `${item.label} selected`);
      }
      return next;
    });
  }, [ALL_OPTIONS, playSound]);

  useEffect(() => {
    if (phase === 'recall') {
      Speech.speak(`Select all ${config.items.length} items you remember.. Tap to select or deselect. Take your time.`);
    }
  }, [phase, config.items.length]);

  const finishGame = useCallback(() => {
    const correct = config.items.filter(item => selectedIds.includes(item.id)).length;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setScore(correct);
    
    if (correct === config.items.length) {
      playSound('success');
    } else if (correct === 0) {
      playSound('error');
    } else {
      playSound('click');
    }

    const nextResult: GameSessionResult = {
      gameId: 'memory_recall',
      difficulty,
      score: correct,
      maxScore: config.items.length,
      timeTakenSeconds: timeTaken,
      completedAt: new Date().toISOString(),
      correctAnswers: correct,
      totalAnswers: config.items.length,
    };
    setResult(nextResult);
    void saveGameSession(nextResult);
    Speech.speak(`You scored ${correct} out of ${config.items.length}.`);
    setPhase('result');
  }, [selectedIds, config, startTime, difficulty, playSound, saveGameSession]);

  const handleReset = () => {
    playSound('click');
    setPhase('instruction');
    setCurrentShowIndex(0);
    setSelectedIds([]);
    setScore(0);
    setResult(null);
  };

  const handleGoBack = () => {
    playSound('back');
    router.back();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="memory_recall"
        difficulty={difficulty}
        steps={[
          { icon: '👀', text: 'Watch the sequence of items that appear one by one' },
          { icon: '🧠', text: 'Memorise each item carefully' },
          { icon: '☑️', text: `Select all ${config.items.length} items you remember from the grid` },
          ...(config.showHints ? [{ icon: '💡', text: 'Category hints are shown to help you' }] : []),
        ]}
        onStart={handleStart}
        onBack={handleGoBack}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} onPlayAgain={handleReset} onBack={handleGoBack} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <GameHeader
        title="Memory Recall"
        difficulty={difficulty}
        timeLeft={phase === 'recall' ? timer.secondsLeft : null}
        onBack={handleGoBack}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        {/* SHOWING phase */}
        {phase === 'showing' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <Text className="text-sm text-gray-400 uppercase tracking-wide">
              Remember this item ({currentShowIndex + 1} of {config.items.length})
            </Text>
            {currentShowIndex < config.items.length ? (
              <View className="w-56 h-56 bg-white rounded-3xl border border-gray-100 items-center justify-center shadow-sm">
                <Text style={{ fontSize: 82 }}>{config.items[currentShowIndex].emoji}</Text>
                <Text className="text-lg font-semibold text-gray-800 mt-2">
                  {config.items[currentShowIndex].label}
                </Text>
                {config.showHints && (
                  <Text className="text-sm text-gray-400 mt-1">
                    {config.items[currentShowIndex].category}
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-lg text-gray-500">Get ready...</Text>
            )}

            <View className="flex-row gap-2">
              {config.items.map((_, i) => (
                <View
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < currentShowIndex ? 'bg-blue-500' : 'bg-gray-200'}`}
                />
              ))}
            </View>
          </View>
        )}

        {/* RECALL phase */}
        {phase === 'recall' && (
          <View style={{ flex: 1 }}>
            <Text className="text-3xl text-gray-500 text-center mb-1">
              Select all items you saw
            </Text>
            <Text className="text-3xl text-gray-400 text-center mb-4">
              {selectedIds.length} selected
            </Text>

            <View className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
              <View
                className={`h-full rounded-full ${timer.isWarning ? 'bg-red-400' : 'bg-blue-400'}`}
                style={{ width: `${100 - timer.progressPercent}%` }}
              />
            </View>

            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', gap: 12, marginBottom: 16 }}>
              {ALL_OPTIONS.map(item => {
                const selected = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleSelect(item.id)}
                    className={`w-40 h-40 rounded-2xl border-2 items-center justify-center ${
                      selected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text style={{ fontSize: 50 }}>{item.emoji}</Text>
                    <Text className={`text-2xl font-medium mt-1 ${selected ? 'text-white' : 'text-gray-600'}`}>
                      {item.label}
                    </Text>
                    {config.showHints && !selected && (
                      <Text className="text-xl text-gray-400">{item.category}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={finishGame}
              disabled={selectedIds.length === 0}
              className={`py-4 rounded-2xl items-center ${selectedIds.length > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <Text className={`font-bold text-xl ${selectedIds.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                Submit Answers
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
